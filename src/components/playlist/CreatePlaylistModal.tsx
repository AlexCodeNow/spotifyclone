'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import { FaTimes, FaMusic, FaImage, FaSpinner } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/components/ui/Notification';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  
  if (!isOpen) return null;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'El archivo seleccionado no es una imagen.', 3000);
      return;
    }
    
    if (file.size > 256 * 1024) {
      showNotification('error', 'La imagen debe ser menor de 256KB.', 3000);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
  };
  
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showNotification('error', 'Necesitas iniciar sesión para crear una playlist.', 3000);
      return;
    }
    
    if (!name.trim()) {
      showNotification('error', 'El nombre de la playlist es obligatorio.', 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: isPublic,
          collaborative: isCollaborative
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la playlist');
      }
      
      const playlistData = await response.json();
      
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = (e.target?.result as string).split(',')[1];
          
          try {
            const uploadResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/images`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
                'Content-Type': 'image/jpeg'
              },
              body: base64Data
            });
            
            if (!uploadResponse.ok) {
              console.error('Error al subir la imagen de la playlist', uploadResponse.status);
              showNotification('info', 'Playlist creada, pero hubo un problema al subir la imagen.', 5000);
            }
          } catch (imageError) {
            console.error('Error al subir la imagen:', imageError);
            showNotification('info', 'Playlist creada, pero hubo un problema al subir la imagen.', 5000);
          }
        };
        
        reader.readAsDataURL(imageFile);
      }
      
      showNotification('success', 'Playlist creada con éxito!', 3000);
      
      onClose();
      router.push(`/playlist/${playlistData.id}`);
      
    } catch (error) {
      console.error('Error creating playlist:', error);
      showNotification('error', 'Error al crear la playlist. Por favor, inténtalo de nuevo.', 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-neutral-900 rounded-lg w-full max-w-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Crear playlist</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCreatePlaylist}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-24 h-24 flex-shrink-0 bg-neutral-800 rounded-md overflow-hidden relative flex items-center justify-center">
              {imagePreview ? (
                <Image src={imagePreview} alt="Vista previa" fill className="object-cover" />
              ) : (
                <FaMusic size={32} className="text-gray-400" />
              )}
            </div>
            
            <div>
              <label className="inline-flex items-center px-4 py-2 bg-neutral-800 text-white rounded-full cursor-pointer hover:bg-neutral-700 transition-colors">
                <FaImage className="mr-2" />
                <span>Elegir imagen</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">JPG o PNG. Máximo 256KB.</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi playlist increíble"
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="playlist-description" className="block text-sm font-medium text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe una descripción para tu playlist"
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
          
          <div className="mb-6 space-y-3">
            <div className="flex items-center">
              <input
                id="is-public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded text-green-500 focus:ring-green-500 bg-neutral-700 border-neutral-600"
              />
              <label htmlFor="is-public" className="ml-2 text-sm text-gray-300">
                Hacer esta playlist pública
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="is-collaborative"
                type="checkbox"
                checked={isCollaborative}
                onChange={(e) => {
                  setIsCollaborative(e.target.checked);
                  if (e.target.checked) {
                    setIsPublic(false);
                  }
                }}
                disabled={isPublic}
                className="h-4 w-4 rounded text-green-500 focus:ring-green-500 bg-neutral-700 border-neutral-600"
              />
              <label htmlFor="is-collaborative" className="ml-2 text-sm text-gray-300">
                Permitir que otros usuarios añadan canciones
                {isPublic && <span className="text-xs text-gray-400 ml-2">(desactiva "pública" primero)</span>}
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-600 text-white hover:border-white transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-green-700 disabled:opacity-70"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}