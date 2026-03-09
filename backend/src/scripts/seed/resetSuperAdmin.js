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

    const superAdmin = await User.collection.findOne({ role: 'super_admin' });

    if (superAdmin) {
      console.log(`  Found corrupted super admin: ${superAdmin.email} (${superAdmin._id})`);
      console.log('  Deleting old document and creating fresh one...');

      // Delete the corrupted document using native driver
      await User.collection.deleteOne({ _id: superAdmin._id });
      console.log('  ✅ Old document deleted');
    } else {
      console.log('  No existing super admin found. Creating new one...');
    }

    // Create a completely fresh super admin document
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    const finalName = newName || (superAdmin && superAdmin.name) || 'Super Admin';

    const newDoc = {
      name:            finalName,
      email:           newEmail,
      password:        hashedPassword,
      phone:           '',
      accountType:     'admin',
      role:            'super_admin',
      customRole:      null,
      status:          'active',
      isEmailVerified: true,
      plan:            'unlimited',
      currentPlan:     null,
      analysisCount:   0,
      analysisLimit:   999999,
      loginAttempts:   0,
      passwordChangeRequired: false,
      lastLogin:       now,
      createdAt:       now,
      updatedAt:       now,
      __v:             0,
    };

    const insertResult = await User.collection.insertOne(newDoc);
    console.log(`  ✅ New document created: ${insertResult.insertedId}`);

    // Verify the new document works with Mongoose
    const verified = await User.findOne({ _id: insertResult.insertedId });

    if (!verified) {
      console.error('❌ Could not read back the new user with Mongoose!');
      process.exit(1);
    }

    // Verify password
    const passwordValid = await bcrypt.compare(newPassword, verified.password);

    // Verify Mongoose updateOne works on the new doc
    const testUpdate = await User.updateOne(
      { _id: verified._id },
      { $set: { updatedAt: new Date() } }
    );

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Super Admin ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID        : ${verified._id}`);
    console.log(`   Name      : ${verified.name}`);
    console.log(`   Email     : ${verified.email}`);
    console.log(`   Password  : ${newPassword}`);
    console.log(`   Status    : ${verified.status}`);
    console.log(`   AccType   : ${verified.accountType}`);
    console.log(`   Role      : ${verified.role}`);
    console.log(`   Pwd check : ${passwordValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Mongoose  : ${testUpdate.matchedCount === 1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
