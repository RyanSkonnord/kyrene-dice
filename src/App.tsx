import './App.scss';

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import KyreneDice from './KyreneDice';
import StaticDocument from './web/StaticDocument';
import { STATIC_PAGE_DIRECTORY, StaticPage } from './web/navigation';
import { GlobalPreferenceProvider } from './globalPreference';

export default function App() {
    function createStaticPageRoutes({ slug, filename }: StaticPage) {
        const slugPath = `/${slug}`;
        const mainRoute = (<Route key={slug}
            path={slugPath}
            element={<StaticDocument key={slug} slug={slug} />}
        />);

        // We want links between raw Markdown files in the Git repository to work the same when
        // being viewed on the site.
        const filenameAlias = (<Route key={filename}
            path={`/${filename}`}
            element={<Navigate to={slugPath} replace />}
        />);
        return [mainRoute, filenameAlias];
    }

    function Router() {
        return <BrowserRouter>
            <Routes>
                <Route path='/' element={<KyreneDice />} />
                {Array.from(STATIC_PAGE_DIRECTORY.values()).flatMap(createStaticPageRoutes)}
                <Route
                    path='*'
                    element={
                        // Redirect bogus URLs to the app root
                        <Navigate to='/' replace />
                    }
                />
            </Routes>
        </BrowserRouter>;
    }

    return <GlobalPreferenceProvider>
        <Router />
    </GlobalPreferenceProvider>;
}
