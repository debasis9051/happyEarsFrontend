import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

function App() {
    return (
        <div className="App">
            <BrowserRouter basename="/">
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/about">About</Link>
                        </li>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                    </ul>
                </nav>
                
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </BrowserRouter>
        </div>
    )
}

const Home = () => <div>Home Page</div>;
const About = () => <div>About Page</div>;
const Dashboard = () => <div>Dashboard Page</div>;

export default App;
