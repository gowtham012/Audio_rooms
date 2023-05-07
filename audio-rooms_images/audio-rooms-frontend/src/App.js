import {Home} from "./screens/Home";
import {AudioRoom} from "./screens/AudioRoom";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Routes, useLocation
} from "react-router-dom";

function App() {
  const location = useLocation()
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={<Home />}
        path="/"
        loader={async () => {
          location.state = {tab: "1"}
        }}
      />
    )
  );

  return (
    <RouterProvider router = {router}/>
  );
}

export default App;
