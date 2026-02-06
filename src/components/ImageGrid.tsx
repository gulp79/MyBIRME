import { useApp } from '@/context/AppContext';
import { ImageCard } from './ImageCard';
import { ImageUploader } from './ImageUploader';

export function ImageGrid() {
  const { state } = useApp();

  if (state.images.length === 0) {
    return <ImageUploader />;
  }

  return (
    <div className="space-y-4">
      {/* Compact uploader when images exist */}
      <ImageUploader />

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {state.images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}
