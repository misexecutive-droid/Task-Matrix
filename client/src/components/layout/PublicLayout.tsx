import { Header } from './Header';
import { Footer } from './Footer';
import { Outlet } from 'react-router';

const PublicLayout = () => {
    return (
        <>
            <div className="flex flex-col min-h-svh" style={{background : 'var(--bg-body)'}}>
                <Header />
                <main className="flex-1">
                    <Outlet/>
                </main>
                <Footer />
            </div>
        </>
    )
}

export { PublicLayout };