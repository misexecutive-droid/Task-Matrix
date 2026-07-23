import { ModernHeroTitle } from "../../components";

interface AuthBackgroundProps {
    tagline?: string;
}

const AuthBackground = ({
    tagline = 'Built for teams that move fast and never miss what matters',
}: AuthBackgroundProps) => {
    return (
        <>

            <aside
                className="hidden lg:flex lg:w-1/2 xl:w-full flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
                style={{ background: 'var(--bg-dark)' }}>

                <span className="absolute inset-6 border border-primary-400/20 rounded-xl pointer-events-none" />
                <span className="absolute -left-28 top-1/2 -translate-y-1/2 size-80 rounded-full border border-coral-400/25 pointer-events-none" />
                <span className="absolute -left-40 top-1/2 -translate-y-1/2 size-[28rem] rounded-full border border-coral-400/15 pointer-events-none" />
                <span className="absolute -right-14 top-12 size-56 rounded-full border border-primary-400/20 pointer-events-none" />
                <span className="absolute -right-20 bottom-12 size-40 rounded-full border border-primary-400/15 pointer-events-none" />
                <span className="absolute -right-6 top-1/2 -translate-y-1/2 size-24 rounded-full bg-coral-500/15 pointer-events-none" />


            </aside>

            <div className="flex flex-col gap-6 relative z-10">
                <ModernHeroTitle />
                <p className="text-white/50 text-sm leading-relaxed max-w-xs font-display">
                    {tagline}
                </p>
            </div>

            <p className="text-white/15 text-xs font-display tracking-widest uppercase z-10">
                &copy; {new Date().getFullYear()} TaskMatrix
            </p>




        </>
    )
}


export { AuthBackground }