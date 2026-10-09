import { BrowserRouter } from "react-router";

import AppRoutes from "./router/routes";

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
