import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {useAuth } from "../../context/AuthContext";
import { connectSocket , releaseSocket } from "../../lib/socket";

export const useNotificationSocket = () => {
    const { token } = useAuth();
    const queryClient =     useQueryClient();

    useEffect(() => {
        if(!token) return;
        const socket = connectSocket(token);
        const handleNew = () => queryClient.invalidateQueries({queryKey : ["notifications"]});

        socket.on("notifcation:new", handleNew)

        return () => {
            socket.off("notification:new", handleNew)
            releaseSocket();
        }
     }, [token , queryClient])
}