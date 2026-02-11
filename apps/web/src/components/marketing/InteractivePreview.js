import { useCallback, useEffect, useState } from 'react';
import { Badge, Container } from 'react-bootstrap';
import {
  FaChartBar,
  FaComments,
  FaDatabase,
  FaMagic,
  FaPlug,
  FaRobot,
  FaSitemap,
} from 'react-icons/fa';
import PremiumCard from '../common/PremiumCard';

const screenshots = [
  {
    key: 'dashboard',
    label: 'Portfolio Overview',
    icon: FaChartBar,
    image: '/images/product/dashboard.jpg',
  },
  {
    key: 'chat',
    label: 'AI Command',
    icon: FaComments,
    image: '/images/product/chat.jpg',
  },
  {
    key: 'agents/wizard',
    label: 'Agent Builder',
    icon: FaMagic,
    image: '/images/product/agents.jpg',
  },
  {
    key: 'data-sources',
    label: 'ERP & Systems',
    icon: FaDatabase,
    image: '/images/product/data-sources.jpg',
  },
  {
    key: 'integrations',
    label: 'Entity Integrations',
    icon: FaPlug,
    image: '/images/product/integrations.jpg',
  },
  {
    key: 'llm-providers',
    label: 'AI Models',
    icon: FaRobot,
    image: '/images/product/llm-providers.jpg',
  },
  {
    key: 'tenants',
    label: 'Portfolio Entities',
    icon: FaSitemap,
    image: '/images/product/tenants.jpg',
  },
];

const InteractivePreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % screenshots.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  const active = screenshots[activeIndex];

  return (
    <section
      className="py-5 position-relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, #1e2228 0%, #13171c 100%)',
      }}
    >
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          opacity: 0.1,
          backgroundImage: 'radial-gradient(#0cd18e 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <Container className="position-relative z-2">
        <div className="text-center mb-5">
          <Badge
            bg="primary"
            className="mb-3 px-3 py-2 rounded-pill bg-opacity-25 text-primary border border-primary border-opacity-25"
          >
            PRODUCT TOUR
          </Badge>
          <h2 className="display-5 fw-bold text-white mb-3">
            See <span className="gradient-text">ServiceTsunami</span> in Action
          </h2>
          <p className="text-soft lead mx-auto" style={{ maxWidth: '600px' }}>
            Explore the unified command center for data, AI agents, and
            enterprise operations.
          </p>
        </div>

        {/* Screenshot Navigation Pills */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          {screenshots.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveIndex(idx)}
                className="btn btn-sm d-flex align-items-center gap-2 rounded-pill px-3 py-2 border-0"
                style={{
                  background:
                    idx === activeIndex
                      ? 'rgba(12, 209, 142, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                  color: idx === activeIndex ? '#0cd18e' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s ease',
                  fontSize: '0.8rem',
                  fontWeight: idx === activeIndex ? 600 : 400,
                }}
              >
                <Icon size={14} />
                <span className="d-none d-md-inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Browser Frame with Screenshot */}
        <div
          className="perspective-container"
          style={{ perspective: '2000px' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="dashboard-mockup mx-auto"
            style={{
              transform: 'rotateX(3deg)',
              transition: 'transform 0.5s ease',
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)',
              maxWidth: '1100px',
            }}
          >
            <PremiumCard
              className="p-0 overflow-hidden border-secondary border-opacity-25"
              style={{ background: 'rgba(13, 17, 23, 0.95)' }}
            >
              {/* Browser Chrome */}
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary border-opacity-25 bg-dark bg-opacity-50">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle bg-danger"
                    style={{ width: '10px', height: '10px' }}
                  />
                  <div
                    className="rounded-circle bg-warning"
                    style={{ width: '10px', height: '10px' }}
                  />
                  <div
                    className="rounded-circle bg-success"
                    style={{ width: '10px', height: '10px' }}
                  />
                </div>
                <div className="text-soft small font-monospace">
                  servicetsunami.com/{active.key}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <active.icon className="text-primary" size={14} />
                  <span className="text-soft small fw-semibold">
                    {active.label}
                  </span>
                </div>
              </div>

              {/* Screenshot Display */}
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#0d1117',
                }}
              >
                <img
                  src={active.image}
                  alt={active.label}
                  style={{
                    width: '100%',
                    display: 'block',
                    transition: 'opacity 0.4s ease',
                  }}
                />
              </div>
            </PremiumCard>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="d-flex justify-content-center gap-2 mt-4">
          {screenshots.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="btn p-0 border-0"
              style={{
                width: idx === activeIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background:
                  idx === activeIndex
                    ? '#0cd18e'
                    : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
              }}
              aria-label={`View ${screenshots[idx].label}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default InteractivePreview;
