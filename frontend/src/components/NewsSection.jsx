import React, { useState } from 'react';
import { newsArticles } from '../data/mockData';

export default function NewsSection({ onSelectArticle }) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 3;
  const totalPages = Math.ceil(newsArticles.length / pageSize);
  const displayedArticles = newsArticles.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <section id="berita" className="news-section">
      <div className="container">
        {/* Section Title with Styled Underline */}
        <div className="section-header-center">
          <div className="title-underline-wrapper">
            <h2 className="news-section-title">Berita &amp; Artikel</h2>
            <span className="title-underline"></span>
          </div>
          <p style={{ color: '#64748b', marginTop: '10px', fontSize: '0.96rem' }}>
            Informasi terkini kegiatan lingkungan hidup, edukasi persampahan, dan kebijakan Pemkot Surabaya
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="news-grid">
          {displayedArticles.map((article) => {
            const isDark = article.theme === 'dark';

            return (
              <article 
                key={article.id} 
                className={`news-card ${isDark ? 'theme-dark' : 'theme-light'}`}
                id={`article-card-${article.id}`}
              >
                <div className="news-card-media">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="news-card-image"
                    loading="lazy"
                  />
                </div>
                <div className="news-card-body">
                  <div className="news-card-meta">
                    <span>{article.category}</span>
                    <span>&bull;</span>
                    <span>{article.date}</span>
                  </div>
                  <h3 className="news-card-title">{article.title}</h3>
                  <p className="news-card-excerpt">{article.summary}</p>
                  <div className="news-card-footer">
                    <button
                      type="button"
                      className="btn-read-more"
                      onClick={() => onSelectArticle(article)}
                    >
                      <span>Baca Selengkapnya</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination Dots & Navigation */}
        <div className="news-pagination-wrapper">
          <button
            type="button"
            className="news-nav-btn"
            onClick={() => setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))}
            aria-label="Artikel sebelumnya"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="news-dots">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`news-dot ${currentPage === idx ? 'active' : ''}`}
                onClick={() => setCurrentPage(idx)}
                aria-label={`Halaman ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="news-nav-btn"
            onClick={() => setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))}
            aria-label="Artikel selanjutnya"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
