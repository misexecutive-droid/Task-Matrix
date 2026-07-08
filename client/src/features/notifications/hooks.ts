import { useMutation , useQuery , useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { notificationApi } from "../../api/notifications";

export const useNotificationsQuery = () => {
    const { token } = useAuth()
    return useQuery({
        queryKey : ["notifications"],
        queryFn : () => notificationApi.getAll().then(r => r.data),
        enabled : !!token
    })
}

export const useMarkNotificationReadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : ( id : string) => notificationApi.markRead(id),
        onSuccess : () => queryClient.invalidateQueries({ queryKey : ["notifications"]})
    })
};

export const useMarkAllNotificationsReadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : () => notificationApi.markAllRead(),
        onSuccess : () => queryClient.invalidateQueries({ queryKey : ["notifications"]})
    })
}
