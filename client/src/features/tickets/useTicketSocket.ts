import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext"
import { connectSocket , disconnectSocket } from "../../lib/socket";

export const useTicketSocket = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient();

    useEffect(() => {
        if(!token) return ;

        const socket = connectSocket(token);
        const invalidateTickets = () => queryClient.invalidateQueries({ queryKey : ["tickets"]})

        socket.on("ticket:created" , invalidateTickets);
        socket.on("ticket:updated" , invalidateTickets);
        socket.on("ticket:assigned" , invalidateTickets)
        socket.on("checklistItem : updated" , invalidateTickets);

        return () => {
            socket.off("ticket:created", invalidateTickets);
            socket.off("ticket:update", invalidateTickets);
            socket.off("ticket:assigned", invalidateTickets);
            socket.off("checklistItem:update", invalidateTickets);
            disconnectSocket()
        };
    }, [token, queryClient])

}