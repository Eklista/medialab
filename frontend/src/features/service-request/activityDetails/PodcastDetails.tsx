// src/features/service-request/activityDetails/PodcastDetails.tsx
import React, { useState } from 'react';
import {
  CrudList,
  CrudItem,
  Select
} from '../components';
import { departments } from '../data/faculties';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

// Interfaces para los modelos de datos
interface Moderator extends CrudItem {
  name: string;
  position: string;
  role: string;
}

interface Guest extends CrudItem {
  name: string;
}

interface PodcastEpisode extends CrudItem {
  name: string;
  topic: string;
  recordingTime: Date | null;
  faculty: string;
  description: string;
  guests: Guest[];
}

const PodcastDetails: React.FC = () => {
  // Estados
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<string | null>(null);
  const [newGuest, setNewGuest] = useState<string>('');

  // Gestión de moderadores
  const handleAddModerator = (moderator: Omit<Moderator, 'id'>) => {
    const newModerator: Moderator = {
      name: moderator.name || '',
      position: moderator.position || '',
      role: moderator.role || '',
      id: `moderator-${Date.now()}`
    };
    setModerators([...moderators, newModerator]);
  };

  const handleUpdateModerator = (id: string, moderator: Partial<Moderator>) => {
    setModerators(
      moderators.map(mod => (mod.id === id ? { ...mod, ...moderator } : mod))
    );
  };

  const handleDeleteModerator = (id: string) => {
    setModerators(moderators.filter(mod => mod.id !== id));
  };

  // Gestión de episodios
  const handleAddEpisode = (episode: Omit<PodcastEpisode, 'id'>) => {
    const newEpisode: PodcastEpisode = {
      id: `episode-${Date.now()}`,
      name: episode.name || '',
      topic: episode.topic || '',
      faculty: episode.faculty || '',
      description: episode.description || '',
      recordingTime: episode.recordingTime || null,
      guests: episode.guests || []
    };
    setEpisodes([...episodes, newEpisode]);
  };

  const handleUpdateEpisode = (id: string, episode: Partial<PodcastEpisode>) => {
    setEpisodes(
      episodes.map(ep => (ep.id === id ? { ...ep, ...episode } : ep))
    );
  };

  const handleDeleteEpisode = (id: string) => {
    setEpisodes(episodes.filter(ep => ep.id !== id));
  };

  // Gestión de invitados (guests) para un episodio
  const handleAddGuest = () => {
    if (!newGuest.trim() || !currentEpisode) return;

    const updatedEpisodes = episodes.map(episode => {
      if (episode.id === currentEpisode) {
        const newGuestObj: Guest = {
          id: `guest-${Date.now()}`,
          name: newGuest
        };
        return {
          ...episode,
          guests: [...(episode.guests || []), newGuestObj]
        };
      }
      return episode;
    });

    setEpisodes(updatedEpisodes);
    setNewGuest('');
  };

  const handleRemoveGuest = (episodeId: string, guestId: string) => {
    const updatedEpisodes = episodes.map(episode => {
      if (episode.id === episodeId) {
        return {
          ...episode,
          guests: episode.guests.filter(guest => guest.id !== guestId)
        };
      }
      return episode;
    });

    setEpisodes(updatedEpisodes);
  };

  // Campos adicionales para CrudList
  const moderatorFields = [
    {
      name: 'position',
      label: 'Cargo',
      placeholder: 'Ej: Profesor, Director, etc.',
      required: true
    },
    {
      name: 'role',
      label: 'Rol en el podcast',
      placeholder: 'Ej: Presentador, Conductor, etc.',
      required: true
    }
  ];

  // Episodios con selector de facultades
  const episodeFields = [
    {
      name: 'topic',
      label: 'Tema',
      placeholder: 'Tema principal del episodio',
      required: true
    },
    {
      name: 'faculty',
      label: 'Facultad/Departamento',
      type: 'select' as const, // Utiliza const assertion para garantizar el tipo correcto
      options: departments,
      required: true
    },
    {
      name: 'description',
      label: 'Descripción',
      placeholder: 'Breve descripción del contenido',
      required: false
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center mb-6">
        <MicrophoneIcon className="h-10 w-10 text-gray-700 mr-4" />
        <div>
          <h2 className="text-xl font-bold">Detalles del Podcast</h2>
          <p className="text-gray-600">
            Configure los moderadores y episodios para su podcast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección de Moderadores */}
        <div>
          <CrudList<Moderator>
            title="Moderadores"
            items={moderators}
            onAddItem={handleAddModerator}
            onUpdateItem={handleUpdateModerator}
            onDeleteItem={handleDeleteModerator}
            addButtonText="Agregar Moderador"
            emptyMessage="No hay moderadores registrados"
            additionalFields={moderatorFields}
            validateInput={(value) => value ? null : 'El nombre es obligatorio'}
          />
        </div>

        {/* Sección de Episodios */}
        <div>
          <CrudList<PodcastEpisode>
            title="Episodios"
            items={episodes}
            onAddItem={handleAddEpisode}
            onUpdateItem={handleUpdateEpisode}
            onDeleteItem={handleDeleteEpisode}
            addButtonText="Agregar Episodio"
            emptyMessage="No hay episodios registrados"
            additionalFields={episodeFields}
            validateInput={(value) => value ? null : 'El nombre es obligatorio'}
          />
        </div>
      </div>

      {/* Sección para agregar invitados a episodios seleccionados */}
      {episodes.length > 0 && (
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Gestión de Invitados por Episodio</h3>
          
          <div className="mb-4">
            <Select
              id="episodeSelector"
              name="episodeSelector"
              label="Seleccione un episodio para gestionar invitados"
              value={currentEpisode || ''}
              onChange={(e) => setCurrentEpisode(e.target.value)}
              options={[
                { value: '', label: 'Seleccione un episodio', disabled: true },
                ...episodes.map(ep => ({ value: ep.id, label: ep.name }))
              ]}
            />
          </div>
          
          {currentEpisode && (
            <div className="mt-4">
              <div className="mb-4">
                {/* Input con botón para añadir invitados */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-1">
                    Agregar invitado
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newGuest}
                      onChange={(e) => setNewGuest(e.target.value)}
                      placeholder="Nombre del invitado"
                      className="rounded-l-lg border border-r-0 border-gray-300 block flex-1 min-w-0 w-full px-4 py-2 focus:ring-black focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleAddGuest}
                      disabled={!newGuest.trim()}
                      className={`rounded-r-lg px-4 py-2 font-medium text-white bg-black 
                        ${!newGuest.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/90'}`}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Lista de invitados para el episodio seleccionado */}
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Invitados registrados:</h4>
                {episodes.find(ep => ep.id === currentEpisode)?.guests?.length ? (
                  <ul className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                    {episodes.find(ep => ep.id === currentEpisode)?.guests.map(guest => (
                      <li key={guest.id} className="flex justify-between items-center p-3">
                        <span>{guest.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(currentEpisode, guest.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm italic">No hay invitados registrados para este episodio.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PodcastDetails;