import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { heroHighlights } from './data';

const noop = () => {};

const HeroSection = ({ onPrimaryCta = noop, onSecondaryCta = noop }) => {
  const { t, i18n } = useTranslation(['landing', 'common']);
  const heroContent = React.useMemo(() => t('landing:hero', { returnObjects: true }), [t, i18n.language]);
  const highlightItems = React.useMemo(
    () =>
      heroHighlights.map(({ key, icon: Icon }) => {
        const highlight = t(`landing:hero.highlights.${key}`, { returnObjects: true });
        return {
          key,
          Icon,
          title: highlight?.title || '',
          description: highlight?.description || '',
        };
      }),
    [t, i18n.language]
  );

  return (
    <section className="hero-section text-white pt-5 pb-4" id="hero">
      <Container className="hero-content py-5">
        <Row className="align-items-center gy-5">
          <Col lg={7} className="text-center text-lg-start pe-lg-5">
            <span className="badge-glow">{heroContent?.badge}</span>
            <h1 className="display-2 fw-bold mt-4 mb-3 section-heading">{heroContent?.title}</h1>
            <p className="lead text-soft mt-3 mb-3">{heroContent?.lead}</p>
            <p className="text-subtle mb-0">{heroContent?.subtext}</p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-lg-start mt-5">
              <Button size="lg" className="px-5 py-3" onClick={onPrimaryCta}>
                {t('common:cta.bookDemo')}
              </Button>
              <Button
                size="lg"
                variant="outline-light"
                className="px-5 py-3"
                onClick={onSecondaryCta}
              >
                {t('common:cta.watchTour')}
              </Button>
            </div>
            <div className="text-subtle mt-3">{heroContent?.subHighlight}</div>
          </Col>
          <Col lg={5}>
            <div className="hero-grid">
              <div className="hero-spotlight">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-soft text-uppercase" style={{ letterSpacing: '0.12em', fontSize: '0.72rem' }}>
                    {heroContent?.spotlight?.heading}
                  </span>
                  <span className="badge-glow">{heroContent?.spotlight?.badge}</span>
                </div>
                {highlightItems.map(({ key, Icon, title, description }) => (
                  <div className="hero-highlight" key={key}>
                    <div className="icon-pill-sm flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="hero-highlight-title">{title}</div>
                      <p className="text-subtle mb-0">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
