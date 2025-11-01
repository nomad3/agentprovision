import React, { useMemo, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSection from './components/marketing/HeroSection';
import {
  lakehouseHighlights,
  aiHighlights,
  roadmapItems,
  featureBlocks,
  pipelineHighlights,
  architectureLayers,
} from './components/marketing/data';
import './LandingPage.css';

const LandingPage = () => {
  const { t, i18n } = useTranslation(['common', 'landing']);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const goToLogin = React.useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentLanguage = (i18n.language || 'en').split('-')[0];
  const languageOptions = useMemo(
    () => [
      { code: 'en', label: t('common:language.english') },
      { code: 'es', label: t('common:language.spanish') },
    ],
    [t, i18n.language]
  );

  const logos = useMemo(() => t('landing:logos.items', { returnObjects: true }) || [], [t, i18n.language]);
  const metricsItems = useMemo(() => t('landing:metrics.items', { returnObjects: true }) || [], [t, i18n.language]);
  const metricsChunks = useMemo(() => {
    if (!Array.isArray(metricsItems)) {
      return [];
    }
    const chunkSize = 3;
    const chunks = [];
    for (let i = 0; i < metricsItems.length; i += chunkSize) {
      chunks.push(metricsItems.slice(i, i + chunkSize));
    }
    return chunks;
  }, [metricsItems]);

  const featureItems = useMemo(
    () =>
      featureBlocks.map(({ key, icon: Icon }) => {
        const definition = t(`landing:features.items.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const lakehousePrimary = useMemo(
    () =>
      lakehouseHighlights.map(({ key, icon: Icon }) => {
        const definition = t(`landing:lakehouse.highlights.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const pipelineItems = useMemo(
    () =>
      pipelineHighlights.map(({ key, icon: Icon }) => {
        const definition = t(`landing:lakehouse.secondary.items.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const aiItems = useMemo(
    () =>
      aiHighlights.map(({ key, icon: Icon }) => {
        const definition = t(`landing:ai.items.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const roadmap = useMemo(
    () =>
      roadmapItems.map(({ key, icon: Icon }) => {
        const definition = t(`landing:roadmap.items.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const architecture = useMemo(
    () =>
      architectureLayers.map(({ key, icon: Icon }) => {
        const definition = t(`landing:architecture.layers.${key}`, { returnObjects: true }) || {};
        return { key, Icon, title: definition.title || '', description: definition.description || '' };
      }),
    [t, i18n.language]
  );

  const testimonials = useMemo(
    () => t('landing:testimonials.items', { returnObjects: true }) || [],
    [t, i18n.language]
  );

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <div>
      <Navbar expand="lg" fixed="top" className={`nav-dark py-3 ${scrolled ? 'scrolled' : ''}`}>
        <Container>
          <Navbar.Brand href="#hero" className="fw-semibold text-white">
            {t('common:brand')}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="primary-nav" className="border-0" />
          <Navbar.Collapse id="primary-nav">
            <Nav className="ms-auto align-items-lg-center gap-lg-4">
              <Nav.Link href="#features" className="mx-2">{t('common:nav.platform')}</Nav.Link>
              <Nav.Link href="#architecture" className="mx-2">{t('common:nav.architecture')}</Nav.Link>
              <Nav.Link href="#stories" className="mx-2">{t('common:nav.customers')}</Nav.Link>
              <Nav.Link href="#cta" className="mx-2">{t('common:nav.pricing')}</Nav.Link>
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  size="sm"
                  className="ms-lg-2 text-uppercase"
                  id="landing-language-switch"
                >
                  {currentLanguage.toUpperCase()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {languageOptions.map(({ code, label }) => (
                    <Dropdown.Item
                      key={code}
                      active={currentLanguage === code}
                      onClick={() => handleLanguageChange(code)}
                    >
                      {label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Button onClick={goToLogin} className="ms-lg-4 px-4 py-2">
                {t('common:cta.bookDemo')}
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        <HeroSection onPrimaryCta={goToLogin} onSecondaryCta={goToLogin} />

        <section id="logos" className="section-thin">
          <Container>
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 text-uppercase text-soft">
              <span className="fw-semibold me-2">{t('landing:logos.heading')}</span>
              {logos.map((name) => (
                <span key={name} className="logo-badge">
                  {name}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <section className="section-wrapper section-ink metrics-section" id="metrics">
          <Container>
            {metricsChunks.map((group, index) => (
              <Row className="g-4 justify-content-center" key={`metrics-${index}`}>
                {group.map((metric) => (
                  <Col md={4} key={metric.label}>
                    <div className="metric-tile h-100">
                      <div className="text-uppercase text-sm text-soft fw-semibold tracking-wide">
                        {metric.label}
                      </div>
                      <h3 className="display-5 fw-bold mt-2 mb-3">{metric.value}</h3>
                      <p className="text-contrast mb-0">{metric.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            ))}
          </Container>
        </section>

        <section id="features" className="section-wrapper section-dark">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold section-heading gradient-text">{t('landing:features.heading')}</h2>
              <p className="lead section-subtitle mt-3">{t('landing:features.subtitle')}</p>
            </div>
            <Row className="g-4">
              {featureItems.map(({ key, Icon, title, description }) => (
                <Col md={4} key={key}>
                  <Card className="feature-card h-100 p-4 border-0">
                    <div className="icon-pill">
                      <Icon size={28} />
                    </div>
                    <Card.Title className="text-white fw-semibold fs-4">{title}</Card.Title>
                    <Card.Text className="text-soft mt-3">{description}</Card.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="lakehouse" className="section-wrapper">
          <Container>
            <Row className="g-5 align-items-center">
              <Col lg={6}>
                <div className="panel-glass p-5">
                  <h2 className="display-5 fw-bold text-white">{t('landing:lakehouse.heading')}</h2>
                  <p className="text-light mt-3">{t('landing:lakehouse.description')}</p>
                  <div className="gradient-divider my-4" />
                  {lakehousePrimary.map(({ key, Icon, title, description }) => (
                    <div className="d-flex align-items-start gap-3 mb-3" key={key}>
                      <div className="icon-pill">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h5 className="text-white fw-semibold mb-1">{title}</h5>
                        <p className="mb-0 text-soft">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col lg={6}>
                <div className="glass-card">
                  <h3 className="fs-3 fw-semibold text-white">{t('landing:lakehouse.secondary.heading')}</h3>
                  <p className="text-soft">{t('landing:lakehouse.secondary.description')}</p>
                  <Row className="g-3 mt-4">
                    {pipelineItems.map(({ key, title, description, Icon }) => (
                      <Col md={6} key={key}>
                        <div className="feature-card p-4 h-100">
                          <Icon size={26} className="text-primary" />
                          <h5 className="text-white fw-semibold mt-3">{title}</h5>
                          <p className="text-soft mb-0">{description}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="architecture" className="section-wrapper section-contrast">
          <Container>
            <Row className="g-5 align-items-center">
              <Col lg={5}>
                <h2 className="display-5 fw-bold text-white">{t('landing:architecture.heading')}</h2>
                <p className="text-soft mt-3">{t('landing:architecture.description')}</p>
              </Col>
              <Col lg={7}>
                <Row className="g-4">
                  {architecture.map(({ key, Icon, title, description }) => (
                    <Col md={4} key={key}>
                      <div className="feature-card h-100 p-4">
                        <div className="icon-pill">
                          <Icon size={26} />
                        </div>
                        <h5 className="text-white fw-semibold mt-2">{title}</h5>
                        <p className="text-soft mb-0">{description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="ai" className="section-wrapper section-contrast">
          <Container>
            <Row className="g-5">
              <Col lg={5}>
                <h2 className="display-5 fw-bold text-white">{t('landing:ai.heading')}</h2>
                <p className="text-soft mt-3">{t('landing:ai.description')}</p>
              </Col>
              <Col lg={7}>
                <Row className="g-4">
                  {aiItems.map(({ key, Icon, title, description }) => (
                    <Col md={4} key={key}>
                      <div className="feature-card h-100 p-4">
                        <div className="icon-pill">
                          <Icon size={26} />
                        </div>
                        <h5 className="text-white fw-semibold">{title}</h5>
                        <p className="text-soft">{description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        <section id="roadmap" className="section-wrapper section-dark">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-4 fw-bold gradient-text">{t('landing:roadmap.heading')}</h2>
              <p className="section-subtitle">{t('landing:roadmap.subtitle')}</p>
            </div>
            <Row className="g-4">
              {roadmap.map(({ key, Icon, title, description }) => (
                <Col md={4} key={key}>
                  <div className="feature-card h-100 p-4">
                    <div className="icon-pill">
                      <Icon size={26} />
                    </div>
                    <h5 className="text-white fw-semibold">{title}</h5>
                    <p className="text-contrast">{description}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="stories" className="section-wrapper">
          <Container>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold gradient-text">{t('landing:testimonials.heading')}</h2>
              <p className="text-soft fs-5 mt-3">{t('landing:testimonials.subtitle')}</p>
            </div>
            <Row className="g-4">
              {testimonials.map(({ quote, author, role }) => (
                <Col md={6} key={author}>
                  <div className="feature-card testimonial-card p-4 h-100">
                    <p className="fs-5 text-contrast mb-4">"{quote}"</p>
                    <div className="mt-auto">
                      <div className="fw-semibold text-white fs-6">{author}</div>
                      <div className="text-soft small mt-1">{role}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section id="cta" className="section-wrapper">
          <Container>
            <div className="cta-banner shadow-lg">
              <div className="cta-banner-content text-white text-center text-md-start">
                <Row className="align-items-center">
                  <Col md={8}>
                    <h2 className="display-5 fw-bold gradient-text">{t('landing:cta.heading')}</h2>
                    <p className="mt-3 mb-0 fs-5 text-soft">{t('landing:cta.description')}</p>
                  </Col>
                  <Col md={4} className="mt-4 mt-md-0 text-md-end">
                    <Button size="lg" className="px-5 py-3" onClick={goToLogin}>
                      {t('common:cta.scheduleCall')}
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="footer py-4 mt-5">
        <Container className="text-center text-soft">
          {t('common:footer.copyright', {
            year: new Date().getFullYear(),
          })}
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;