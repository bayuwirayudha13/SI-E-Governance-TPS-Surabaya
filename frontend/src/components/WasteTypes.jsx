import React from 'react';
import { wasteTypesData } from '../data/mockData';

export default function WasteTypes({ onOpenRewardModal, onSelectGuide }) {
  return (
    <section id="jenis-sampah" className="waste-section">
      <div className="waste-contour-bg"></div>
      <div className="container">
        {/* Centered Title with Underline */}
        <div className="section-header-center">
          <div className="title-underline-wrapper">
            <h2 className="waste-section-title">Jenis Sampah</h2>
            <span className="title-underline"></span>
          </div>
          <p className="waste-section-subtitle">
            Kenali kategori sampah untuk pemilahan yang tepat dan perolehan reward optimal
          </p>
        </div>

        {/* 3 White Cards Grid */}
        <div className="waste-cards-grid">
          {wasteTypesData.map((waste) => {
            return (
              <div key={waste.id} className="waste-card" id={`waste-card-${waste.id}`}>
                {/* Color Top Border Accent */}
                <div className={`waste-card-top-bar ${waste.badgeColor}`}></div>
                
                <h3 className="waste-card-title">{waste.title}</h3>
                
                <ul className="waste-card-list">
                  {waste.items.map((item, idx) => (
                    <li key={idx} className="waste-card-item">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="waste-card-action">
                  {waste.actionType === 'reward' ? (
                    <button
                      type="button"
                      className={`btn-waste-action ${waste.badgeColor}`}
                      onClick={onOpenRewardModal}
                      id="btn-waste-reward"
                    >
                      {waste.buttonText} &rarr;
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn-waste-action ${waste.badgeColor}`}
                      onClick={() => onSelectGuide(waste)}
                    >
                      {waste.buttonText}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
