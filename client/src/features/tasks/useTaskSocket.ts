import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext"
import { connectSocket, disconnectSocket, releaseSocket } from "../../lib/socket";

export const useTaskSocket = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!token) return;

        const socket = connectSocket(token);
        const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ["tasks"] })

        socket.on("task:created", invalidateTasks);

        return () => {
            socket.off("task:created", invalidateTasks);
            releaseSocket()
            disconnectSocket()
        };

    }, [token, queryClient])

}
