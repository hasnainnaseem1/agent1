/**
 * Reset Super Admin Credentials
 *
 * Updates the existing super admin's email and password.
 * If no super admin exists, creates one.
 *
 * Usage (on server):
 *   node src/scripts/seed/resetSuperAdmin.js
 *
 * Or with custom credentials via env vars:
 *   NEW_ADMIN_EMAIL=you@example.com NEW_ADMIN_PASSWORD=MyNewPass@123 node src/scripts/seed/resetSuperAdmin.js
 */

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ── Prompt helper ────────────────────────────────────────────────────────────
function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Hide typed characters for password input
      process.stdout.write(question);
      let value = '';
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', function handler(ch) {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          if (ch === '\u0003') process.exit(); // Ctrl+C
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          resolve(value);
        } else if (ch === '\u007f') {
          // Backspace
          if (value.length > 0) value = value.slice(0, -1);
        } else {
          value += ch;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Reset Super Admin Credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Resolve credentials: env vars → interactive prompts
  let newEmail    = process.env.NEW_ADMIN_EMAIL    || '';
  let newPassword = process.env.NEW_ADMIN_PASSWORD || '';
  let newName     = process.env.NEW_ADMIN_NAME     || '';

  if (!newEmail) {
    newEmail = await prompt('  New email address : ');
  }
  if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
    console.error('\n❌ Invalid email address. Aborting.');
    process.exit(1);
  }

  if (!newPassword) {
    newPassword = await prompt('  New password      : ', true);
  }
  if (!newPassword || newPassword.length < 8) {
    console.error('\n❌ Password must be at least 8 characters. Aborting.');
    process.exit(1);
  }

  if (!newName) {
    const nameInput = await prompt('  Display name (press Enter to keep existing): ');
    if (nameInput) newName = nameInput;
  }

  console.log('');
  console.log('  Connecting to MongoDB...');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Load model AFTER connecting — resolve path regardless of script depth in src/scripts/
    const srcDir = (function findSrc(dir) {
      if (path.basename(dir) === 'src') return dir;
      const parent = path.dirname(dir);
      return parent === dir ? dir : findSrc(parent);
    })(__dirname);
    const { User } = require(path.join(srcDir, 'models/user'));

    const superAdmin = await User.findOne({ role: 'super_admin' });

    if (superAdmin) {
      // ── Update existing super admin — use direct update to avoid version conflicts ──
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.collection.updateOne(
        { _id: superAdmin._id },
        {
          $set: {
            email:           newEmail,
            password:        hashedPassword,
            status:          'active',
            isEmailVerified: true,
            updatedAt:       new Date(),
            ...(newName && { name: newName }),
          }
        }
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Super Admin credentials updated!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Name     : ${superAdmin.name}`);
      console.log(`   Email    : ${superAdmin.email}`);
      console.log(`   Password : ${newPassword}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      // ── No super admin found — create one ───────────────────────────────
      console.log('⚠️  No super admin found. Creating one...');

      const created = new User({
        name:            newName || 'Super Admin',
        email:           newEmail,
        password:        newPassword,
        accountType:     'admin',
        role:            'super_admin',
        status:          'active',
        isEmailVerified: true,
      });

      await created.save();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Super Admin created!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Name     : ${created.name}`);
      console.log(`   Email    : ${created.email}`);
      console.log(`   Password : ${newPassword}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    console.log('');
    console.log('  Login at: https://me.sellsera.com');
    console.log('');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
