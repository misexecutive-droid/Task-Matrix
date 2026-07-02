import { useState } from 'react'
import { NavLink , Outlet } from 'react-router'
import { LayoutDashboard , Users, TicketCheck , Settings , LogOut } from 'lucide-react'
import { useAuth } from "../../context/AuthContext"
import { Header , Footer } from "../../components/layout"

const NAV = [
    { to : '/admin' ,  icon : LayoutDashboard , label : 'Overview' , end : true},
    { to : '/admin/users' , icon : Users , label : 'Users' , end : false},
    { to : '/admin/tickets' , icon : TicketCheck , label : 'Tickets' , end : false},
    { to : "/admin/settings" , icon : Settings ,   label : "Settings" , end : false}
]

export const AdminLayout = () => {
    const { user , layout } = useAuth()
    const [ sidebarOpen , setSidebarOpen] = useState(true)
    const initials = (user?.name ?? 'A').split(' ').map(w => w[0].slice(0,2).join('').toUpperCase();

    return (
        <>
        <div className='flex flex-col min-h-svh' style={{ background : 'var(--bg-body)'}}>


            <Header onToggleSidebar={() => setSidebarOpen(v => !v)}/>
            <div className='flex flex-1 min-h-0'>
                <aside 
                   className={
                    [ 'flex flex-col border-r border-slate-200/60 transition-all duration-300 overflow-hidden'
                        sidebarOpen ? 'w-60 px-3 py-5' : 'w-[60px] px-2 py-5',
                    ].join(' ')
                   }
            </div>
        </div>
       
       </>
    )
}