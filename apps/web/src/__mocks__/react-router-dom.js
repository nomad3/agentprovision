const useLocation = jest.fn(() => ({ pathname: '/', search: '', hash: '', state: null }));

module.exports = {
  useNavigate: () => jest.fn(),
  useLocation,
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
  Route: ({ children }) => children,
  Routes: ({ children }) => children,
  Link: ({ children, to }) => children,
};
