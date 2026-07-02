import React from 'react';
import { useRouteError , isRouterErrorResponse } from 'react-router-dom';

function MyErrorBoundary(){
    const error = useRouteError();
    console.log("Detailed error:", error);

    if(isRouterErrorResponse(error)){
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-red-600">Error {error.status}</h1>
                <p className="text-lg text-gray-700">{error.statusText}</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-red-600">An unexpected error occurred</h1>
            <p className="text-lg text-gray-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
    );
}

export default MyErrorBoundary;