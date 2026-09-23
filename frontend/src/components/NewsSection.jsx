import React from 'react';
import { newsArticles } from '../data/mockData';

export default function NewsSection({ onSelectArticle }) {
  return (
    <section id="berita" className="news-section">
      <div className="container">
        {/* Section Title with Styled Underline */}
        <div className="section-header-center">
          <div className="title-underline-wrapper">
            <h2 className="news-section-title">Berita &amp; Artikel</h2>
            <span className="title-underline"></span>
          </div>
          <p style={{ color: '#64748b', marginTop: '14px', fontSize: '1rem' }}>
            Informasi terkini kegiatan lingkungan hidup, edukasi persampahan, dan kebijakan Pemkot Surabaya
          </p>
        </div>

        {/* 6 Cards Grid (Alternating Light & Dark Green Cards) */}
        <div className="news-grid">
          {newsArticles.map((article) => {
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
      </div>
    </section>
  );
}
