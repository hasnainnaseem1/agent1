import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Eye, Tag, TrendingUp, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSite } from '../context/SiteContext';
import { updatePageSeo, setBreadcrumbSchema, clearPageSchemas } from '../utils/seoHelpers';
import config from '../config';

function BlogListPage() {
  const { site, seo } = useSite();
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const primaryColor = site.primaryColor || '#7c3aed';

  useEffect(() => {
    const blogUrl = `${window.location.origin}/blog`;
    updatePageSeo({
      title: `Blog — ${site.siteName || 'Our Blog'}`,
      description: `Read the latest articles and insights from ${site.siteName || 'our blog'}.`,
      ogImage: seo.defaultOgImage || '',
      ogType: 'website',
      canonicalUrl: blogUrl,
      siteName: site.siteName || '',
      url: blogUrl,
      twitterHandle: seo.socialLinks?.twitter || '',
    });
    setBreadcrumbSchema([
      { name: 'Home', url: window.location.origin },
      { name: 'Blog', url: blogUrl },
    ]);
    return () => clearPageSchemas();
  }, [site.siteName, seo]);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, [search, activeCategory, currentPage]);

  // Fetch popular & categories on mount
  useEffect(() => {
    fetchPopular();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9,
      });
      if (search) params.set('search', search);
      if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);

      const res = await fetch(`${config.apiUrl}/api/v1/public/blog/posts?${params}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopular = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/blog/popular`);
      const data = await res.json();
      if (data.success) setPopularPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch popular posts:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/blog/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/[0.07] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.1] rounded-full px-4 py-1.5 text-sm font-medium text-gray-300 mb-6">
            <BookOpen className="w-4 h-4" />
            Resources & Insights
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Blog
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Guides, tips, and strategies to help you grow.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-24 py-3.5 rounded-full border border-white/[0.1] focus:outline-none focus:border-white/30 bg-white/[0.06] text-white placeholder-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-gray-50">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content */}
          <div className="flex-1">
            {/* Category Tabs */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => { setActiveCategory('All'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeCategory === 'All'
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  style={activeCategory === 'All' ? { backgroundColor: primaryColor } : {}}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      activeCategory === cat.name
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                    style={activeCategory === cat.name ? { backgroundColor: primaryColor } : {}}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-5">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                      <div className="h-6 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No posts found</h3>
                <p className="text-gray-400">
                  {search ? 'Try a different search term.' : 'Check back soon for new articles!'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/blog/${post.slug}`}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group block"
                    >
                      {/* Image */}
                      <div className="h-48 overflow-hidden bg-gray-100">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)` }}>
                            <BookOpen className="w-12 h-12" style={{ color: primaryColor }} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            {post.category}
                          </span>
                          {post.isFeatured && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              Featured
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {post.readTime || 1} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {post.views || 0}
                            </span>
                          </div>
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          page === currentPage
                            ? 'text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                        }`}
                        style={page === currentPage ? { backgroundColor: primaryColor } : {}}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Most Popular */}
            {popularPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
                  Most Popular
                </h3>
                <div className="space-y-4">
                  {popularPosts.map((post, i) => (
                    <Link
                      key={post._id}
                      to={`/blog/${post.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views} views
                          </span>
                          <span>·</span>
                          <span>{post.readTime || 1} min</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" style={{ color: primaryColor }} />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => { setActiveCategory(cat.name); setCurrentPage(1); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                        activeCategory === cat.name
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={activeCategory === cat.name ? { backgroundColor: primaryColor } : {}}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeCategory === cat.name
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default BlogListPage;
