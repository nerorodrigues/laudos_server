import 'semantic-ui-css/semantic.min.css';
import { Menu } from "semantic-ui-react";
import { Link } from "react-router-dom";
import App from './src/upload';

export default function MyApp({ Component, pageProps }) {
    return (
        <div>
            <Menu>
                <Menu.Item>
                    <a href="/src/logoff">Logoff</a>
                </Menu.Item>
                <Menu.Item>
                    <a href="/src/upload">Upload</a>
                </Menu.Item>
            </Menu>
            <Component {...pageProps} />
        </div>
    )
}