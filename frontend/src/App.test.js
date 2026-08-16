import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SiteShell from './components/layout/SiteShell';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import CertificationsPage from './pages/CertificationsPage';
import ContactPage from './pages/ContactPage';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path={path} element={element} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('SiteShell', () => {
  test('renders navigation exactly once around the outlet', () => {
    renderAt('/', <HomePage />);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  test('exposes every public route link', () => {
    renderAt('/', <HomePage />);
    ['About', 'Projects', 'Certifications', 'Contact'].forEach((label) => {
      expect(
        screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })
      ).toBeInTheDocument();
    });
  });

  test('renders a single main landmark', () => {
    renderAt('/', <HomePage />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});

describe('public pages render without theme props', () => {
  test('Home', () => {
    renderAt('/', <HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('Projects', () => {
    renderAt('/projects', <ProjectsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('Certifications', () => {
    renderAt('/certifications', <CertificationsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('Contact', () => {
    renderAt('/contact', <ContactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('About content survives the redesign', () => {
  test('all five sections are present with their original titles', () => {
    renderAt('/about', <AboutPage />);
    ['Who I Am', 'My Expertise', 'My Approach', 'My Education', "Let's Connect"].forEach(
      (heading) => {
        expect(screen.getByText(heading)).toBeInTheDocument();
      }
    );
  });

  test('the education details are not replaced with placeholder copy', () => {
    renderAt('/about', <AboutPage />);
    expect(screen.getByText(/PES University/i)).toBeInTheDocument();
    expect(screen.getByText(/Rosary High School/i)).toBeInTheDocument();
  });
});

describe('Contact keeps its real contact details', () => {
  test('email and phone links are unchanged', () => {
    renderAt('/contact', <ContactPage />);
    expect(
      screen.getByRole('link', { name: /adithyavholla23@gmail\.com/i })
    ).toHaveAttribute('href', 'mailto:adithyavholla23@gmail.com');
    expect(screen.getByRole('link', { name: /\+91 9404110669/ })).toHaveAttribute(
      'href',
      'tel:+919404110669'
    );
  });

  test('the message form is still present and submittable', () => {
    renderAt('/contact', <ContactPage />);
    expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
  });
});
