import React from 'react';

const Loading = () => {
    return (
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
};

export default Loading;
