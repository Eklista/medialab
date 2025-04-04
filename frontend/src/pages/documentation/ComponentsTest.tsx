// src/pages/documentation/ComponentsTest.tsx
import React, { useState } from 'react';
import { Navbar, Footer } from '../../components/layout';
import {
  TextInput,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Button,
  InputWithButton,
  Modal,
  DataTable,
  CrudList,
  Select,
  CheckboxOption,
  Column
} from '../../features/service-request/components';

// Tipos y datos de ejemplo
interface PodcastEpisode {
  id: number;
  title: string;
  description: string;
  duration: string;
  publishDate: string;
  status: 'published' | 'draft' | 'scheduled';
}

// Aseguramos que las interfaces tengan todas las propiedades necesarias
type CourseClassType = {
  id: string;
  name: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
}

type ModeratorType = {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ComponentsTest: React.FC = () => {
  // Estados para los ejemplos de formularios
  const [activityType, setActivityType] = useState('');
  const [podcastName, setPodcastName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  
  // Opciones para selects
  const activityTypes = [
    { value: '', label: 'Seleccione un tipo de actividad', disabled: true },
    { value: 'single', label: 'Actividad Única' },
    { value: 'recurrent', label: 'Actividad Recurrente' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'course', label: 'Curso' }
  ];
  
  // Para checkboxes de servicios
  const serviceOptions: CheckboxOption[] = [
    { id: 'recording', label: 'Grabación', value: 'recording' },
    { id: 'editing', label: 'Edición', value: 'editing' },
    { id: 'streaming', label: 'Streaming', value: 'streaming' },
    { id: 'subtitles', label: 'Subtítulos', value: 'subtitles' },
    { id: 'graphic', label: 'Diseño Gráfico', value: 'graphic' },
    { id: 'photography', label: 'Fotografía', value: 'photography' }
  ];
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Modal de ejemplo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('');
  const [modalEndTime, setModalEndTime] = useState('');
  
  // Estado para el CRUD simple de episodios
  const [episodes, setEpisodes] = useState<{id: string, name: string}[]>([
    { id: '1', name: 'Episodio 1: Introducción' },
    { id: '2', name: 'Episodio 2: Desarrollo' }
  ]);

  const handleAddEpisode = (name: string) => {
    if (name.trim() === '') return;
    const newEpisode = {
      id: Date.now().toString(),
      name: name
    };
    setEpisodes(prev => [...prev, newEpisode]);
  };

  const handleDeleteEpisode = (id: string) => {
    setEpisodes(prev => prev.filter(episode => episode.id !== id));
  };
  
  // Datos para la tabla de episodios de podcast
  const [podcastEpisodes] = useState<PodcastEpisode[]>([
    { 
      id: 1, 
      title: 'Introducción a la Inteligencia Artificial', 
      description: 'Episodio introductorio sobre IA y sus aplicaciones', 
      duration: '32:45', 
      publishDate: '2025-03-15', 
      status: 'published' 
    },
    { 
      id: 2, 
      title: 'Machine Learning Aplicado', 
      description: 'Cómo aplicar el ML en proyectos reales', 
      duration: '45:20', 
      publishDate: '2025-03-22', 
      status: 'scheduled' 
    },
    { 
      id: 3, 
      title: 'Ética en la IA', 
      description: 'Consideraciones éticas en el desarrollo de IA', 
      duration: '38:10', 
      publishDate: '2025-04-01', 
      status: 'draft' 
    }
  ]);
  
  const podcastEpisodesColumns: Column<PodcastEpisode>[] = [
    { header: 'Título', accessor: 'title' },
    { header: 'Duración', accessor: 'duration' },
    { header: 'Fecha', accessor: 'publishDate' },
    { 
      header: 'Estado', 
      accessor: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.status === 'published' ? 'bg-green-100 text-green-800' : 
          item.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {item.status === 'published' ? 'Publicado' : 
           item.status === 'scheduled' ? 'Programado' : 'Borrador'}
        </span>
      ) 
    }
  ];
  
  // Estado para el CRUD de clases de curso
  const [courseClasses, setCourseClasses] = useState<CourseClassType[]>([
    { id: '1', name: 'Introducción a la Programación', instructor: 'Dr. Juan Pérez', date: '2025-03-10', time: '08:00', duration: '2 horas' },
    { id: '2', name: 'Estructuras de Datos', instructor: 'Dra. María García', date: '2025-03-17', time: '08:00', duration: '2 horas' }
  ]);
  
  // Estado para el CRUD de moderadores
  const [moderators, setModerators] = useState<ModeratorType[]>([
    { id: '1', name: 'Carlos López', email: 'carlos@ejemplo.com', role: 'Host Principal' },
    { id: '2', name: 'Ana Martínez', email: 'ana@ejemplo.com', role: 'Co-host' }
  ]);
  
  // Funciones para los CRUDs
  const handleAddClass = (classData: Omit<CourseClassType, 'id'>) => {
    const newClass: CourseClassType = {
      id: Date.now().toString(),
      ...classData
    };
    setCourseClasses([...courseClasses, newClass]);
  };
  
  const handleUpdateClass = (id: string, classData: Partial<CourseClassType>) => {
    setCourseClasses(
      courseClasses.map(classItem => 
        classItem.id === id ? { ...classItem, ...classData } : classItem
      )
    );
  };
  
  const handleDeleteClass = (id: string) => {
    setCourseClasses(courseClasses.filter(classItem => classItem.id !== id));
  };
  
  const handleAddModerator = (moderatorData: Omit<ModeratorType, 'id'>) => {
    const newModerator: ModeratorType = {
      id: Date.now().toString(),
      ...moderatorData
    };
    setModerators([...moderators, newModerator]);
  };
  
  const handleUpdateModerator = (id: string, moderatorData: Partial<ModeratorType>) => {
    setModerators(
      moderators.map(moderator => 
        moderator.id === id ? { ...moderator, ...moderatorData } : moderator
      )
    );
  };
  
  const handleDeleteModerator = (id: string) => {
    setModerators(moderators.filter(moderator => moderator.id !== id));
  };

  // Manejador para añadir fechas desde el modal
  const handleAddDate = () => {
    if (modalDate && modalStartTime && modalEndTime) {
      console.log('Fecha añadida:', { date: modalDate, start: modalStartTime, end: modalEndTime });
      // Aquí podrías añadir la fecha a un estado
      setModalDate('');
      setModalStartTime('');
      setModalEndTime('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Inter', 'Poppins', sans-serif]">
      <Navbar />
      
      <main className="flex-grow">
        <div className="py-10">
          <header className="mb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Componentes de Formulario</h1>
              <p className="mt-2 text-lg text-gray-600">Biblioteca de componentes para el sistema de solicitud de servicios MediaLab</p>
            </div>
          </header>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {/* Sección 1: Componentes básicos */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b">Componentes Básicos de Formulario</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inputs de texto */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Campos de Texto</h3>
                      
                      <TextInput
                        id="podcast-name"
                        name="podcast-name"
                        label="Nombre del Podcast"
                        value={podcastName}
                        onChange={(e) => setPodcastName(e.target.value)}
                        placeholder="Ej: Tech Talks Galileo"
                        required
                      />
                      
                      <Textarea
                        id="description"
                        name="description"
                        label="Descripción de la Actividad"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describa brevemente la actividad..."
                        rows={3}
                        helperText="Máximo 500 caracteres"
                        maxLength={500}
                        showCharCount
                      />
                    </div>
                    
                    {/* Selects y Fechas */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Selects y Fechas</h3>
                      
                      <Select
                        id="activity-type"
                        name="activity-type"
                        label="Tipo de Actividad"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        options={activityTypes}
                        required
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextInput
                          id="start-date"
                          name="start-date"
                          label="Fecha de Inicio"
                          type="text"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          placeholder="AAAA-MM-DD"
                        />
                        
                        <TextInput
                          id="end-date"
                          name="end-date"
                          label="Fecha de Fin"
                          type="text"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          placeholder="AAAA-MM-DD"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Checkboxes */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Checkboxes</h3>
                      
                      <Checkbox
                        id="is-recurrent"
                        name="is-recurrent"
                        label="¿Es una actividad recurrente?"
                        checked={isRecurrent}
                        onChange={(e) => setIsRecurrent(e.target.checked)}
                      />
                      
                      <CheckboxGroup
                        name="services"
                        label="Servicios Requeridos"
                        options={serviceOptions}
                        selectedValues={selectedServices}
                        onChange={setSelectedServices}
                        columns={2}
                      />
                    </div>
                    
                    {/* Botones */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Botones</h3>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button variant="primary">Guardar</Button>
                        <Button variant="outline">Cancelar</Button>
                        <Button 
                          variant="primary" 
                          onClick={() => setIsModalOpen(true)}
                          leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          }
                        >
                          Abrir Modal
                        </Button>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="primary" fullWidth>Enviar Solicitud</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Sección 2: CRUD Simple */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b">CRUD Simple de Episodios</h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">Ejemplo de gestión básica de episodios para podcasts.</p>
                    
                    <InputWithButton
                      id="add-episode"
                      name="add-episode"
                      label="Agregar Episodio"
                      placeholder="Nombre del episodio"
                      buttonText="Agregar"
                      onAdd={handleAddEpisode}
                      buttonIcon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      }
                    />
                  </div>
                  
                  {/* Lista de episodios */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Episodios</h3>
                    
                    {episodes.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500">No hay episodios disponibles</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                        {episodes.map((episode) => (
                          <li key={episode.id} className="flex items-center justify-between p-4 bg-white">
                            <span className="font-medium text-black">{episode.name}</span>
                            <div className="flex space-x-2">
                              <Button
                                variant="text"
                                size="sm"
                                onClick={() => handleDeleteEpisode(episode.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
              
              {/* Sección 3: Tabla de Datos */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b">Tabla de Episodios</h2>
                  
                  <DataTable
                    columns={podcastEpisodesColumns}
                    data={podcastEpisodes}
                    keyExtractor={(item) => item.id.toString()}
                    actionColumn
                    onEdit={(item) => console.log('Editar episodio:', item)}
                    onDelete={(item) => console.log('Eliminar episodio:', item)}
                  />
                </div>
              </section>
              
              {/* Sección 4: CRUDs Avanzados */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b">CRUDs Avanzados</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CRUD de Clases */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Clases del Curso</h3>
                      
                      <CrudList
                        items={courseClasses}
                        onAddItem={handleAddClass as any}
                        onUpdateItem={handleUpdateClass}
                        onDeleteItem={handleDeleteClass}
                        title="Clases"
                        addButtonText="Agregar Clase"
                        additionalFields={[
                          {
                            name: 'instructor',
                            label: 'Instructor',
                            placeholder: 'Nombre del instructor',
                            required: true,
                          },
                          {
                            name: 'date',
                            label: 'Fecha',
                            placeholder: 'YYYY-MM-DD',
                            required: true,
                          },
                          {
                            name: 'time',
                            label: 'Hora',
                            placeholder: 'HH:MM',
                            required: true,
                          },
                          {
                            name: 'duration',
                            label: 'Duración',
                            placeholder: 'Ej: 2 horas',
                            required: true,
                          }
                        ]}
                      />
                    </div>
                    
                    {/* CRUD de Moderadores */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Moderadores del Podcast</h3>
                      
                      <CrudList
                        items={moderators}
                        onAddItem={handleAddModerator as any}
                        onUpdateItem={handleUpdateModerator}
                        onDeleteItem={handleDeleteModerator}
                        title="Moderadores"
                        addButtonText="Agregar Moderador"
                        additionalFields={[
                          {
                            name: 'email',
                            label: 'Correo Electrónico',
                            placeholder: 'email@ejemplo.com',
                            type: 'email',
                            required: true,
                          },
                          {
                            name: 'role',
                            label: 'Rol',
                            placeholder: 'Ej: Host, Co-host, Invitado',
                            required: true,
                          }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modal de Ejemplo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agregar Fechas Manualmente"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDate}>
              Guardar Fechas
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Seleccione manualmente las fechas en las que ocurrirá la actividad.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              id="modal-date"
              name="modal-date"
              label="Fecha"
              type="text"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              required
              placeholder="AAAA-MM-DD"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                id="modal-start-time"
                name="modal-start-time"
                label="Hora inicio"
                type="text"
                value={modalStartTime}
                onChange={(e) => setModalStartTime(e.target.value)}
                required
                placeholder="HH:MM"
              />
              
              <TextInput
                id="modal-end-time"
                name="modal-end-time"
                label="Hora fin"
                type="text"
                value={modalEndTime}
                onChange={(e) => setModalEndTime(e.target.value)}
                required
                placeholder="HH:MM"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Agregar Otra Fecha
          </Button>
        </div>
      </Modal>
      
      <Footer />
    </div>
  );
};

export default ComponentsTest;