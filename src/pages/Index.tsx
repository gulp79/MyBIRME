import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { ImageGrid } from '@/components/ImageGrid';
import { Sidebar } from '@/components/Sidebar';
import { CropEditorModal } from '@/components/CropEditorModal';

function AppContent() {
  const { state, setEditingImage } = useApp();

  const editingImage = state.editingImageId
    ? state.images.find((img) => img.id === state.editingImageId)
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ImageGrid />
        </main>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Crop editor modal */}
      {editingImage && (
        <CropEditorModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
