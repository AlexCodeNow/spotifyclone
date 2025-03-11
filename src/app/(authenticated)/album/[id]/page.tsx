import { Suspense } from 'react';
import AlbumContent from './AlbumContent';

export default function AlbumPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    }>
      <AlbumContent id={params.id} />
    </Suspense>
  );
}