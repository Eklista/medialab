// src/pages/content-platform/VideoPage.tsx - Rediseñada estilo YouTube
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoLayout } from '../../components/layout/VideoLayout';
import { UniversalVideoPlayer } from '../../components/video/UniversalVideoPlayer';
import { VideoData } from '../../types/video';
import { 
  EyeIcon, 
  CalendarIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';

// Videos de ejemplo con links reales de YouTube
const videoExamples: VideoData[] = [
  {
    id: 'graduacion',
    title: 'Graduación Universidad Galileo 2024',
    description: `Ceremonia de graduación de la promoción 2024 de Universidad Galileo. Una celebración llena de emoción y logros académicos.

En esta ceremonia especial, celebramos el esfuerzo y dedicación de nuestros graduados que han completado exitosamente sus estudios universitarios.

Momentos destacados de la ceremonia:
• Procesión académica de autoridades y graduados
• Discurso inspirador del Rector de la Universidad
• Entrega de diplomas y reconocimientos especiales
• Juramentación de los nuevos profesionales
• Himno universitario y ceremonia de clausura

La ceremonia se llevó a cabo en el Auditorio Principal de Universidad Galileo con la presencia de familiares, amigos y autoridades académicas.

Felicitamos a todos nuestros graduados por este importante logro académico y les deseamos éxito en su vida profesional.`,
    thumbnail: '/api/placeholder/800/450',
    duration: '1:20:45',
    views: 25600,
    category: 'Graduaciones',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-02-28',
    tags: ['graduación', 'universidad', 'galileo', 'ceremonia', '2024'],
    instructor: 'Dr. José Eduardo Suger Cofiño',
    event: 'Graduación Universidad Galileo 2024',
    location: 'Auditorio Principal - Universidad Galileo',
    academicYear: '2024',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=NDgKuUJQn6Y',
    videoId: 'NDgKuUJQn6Y'
  },
  {
    id: 'reportaje',
    title: 'Reportaje: Innovación y Tecnología en Universidad Galileo',
    description: `Reportaje especial sobre los proyectos de innovación y tecnología que se desarrollan en Universidad Galileo.

Conoce de primera mano los proyectos más destacados que nuestros estudiantes y profesores están desarrollando en diferentes áreas de la tecnología y la innovación.

Contenido del reportaje:
• Laboratorios de última generación
• Proyectos estudiantiles innovadores
• Investigación aplicada en tecnología
• Testimonios de estudiantes y profesores
• Instalaciones y equipamiento de vanguardia

Este reportaje muestra el compromiso de Universidad Galileo con la excelencia académica y la formación de profesionales altamente capacitados para enfrentar los desafíos del mundo moderno.

La universidad continúa invirtiendo en tecnología y recursos para brindar la mejor educación a sus estudiantes.`,
    thumbnail: '/api/placeholder/800/450',
    duration: '25:30',
    views: 18700,
    category: 'Reportajes',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-03-15',
    tags: ['reportaje', 'innovación', 'tecnología', 'universidad', 'galileo'],
    instructor: 'Equipo MediaLab',
    event: 'Reportaje Institucional',
    location: 'Campus Universidad Galileo',
    academicYear: '2024',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=wYT5Dp9rEWU',
    videoId: 'wYT5Dp9rEWU'
  },
  {
    id: 'video-random',
    title: 'Evento Especial Universidad Galileo',
    description: `Video especial de Universidad Galileo mostrando diversos aspectos de la vida universitaria y académica.

Este video presenta una visión integral de lo que significa ser parte de la comunidad universitaria de Universidad Galileo, desde la perspectiva estudiantil hasta la experiencia docente.

Aspectos destacados:
• Vida estudiantil en el campus
• Actividades académicas y extracurriculares
• Instalaciones y servicios universitarios
• Testimonio de estudiantes y egresados
• Programas académicos destacados

Universidad Galileo se caracteriza por su enfoque en la excelencia académica, la innovación educativa y el desarrollo integral de sus estudiantes.

Conoce más sobre nuestra propuesta educativa y cómo puedes ser parte de esta gran comunidad académica.`,
    thumbnail: '/api/placeholder/800/450',
    duration: '15:45',
    views: 12400,
    category: 'Institucional',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-03-10',
    tags: ['universidad', 'galileo', 'estudiantes', 'campus', 'educación'],
    instructor: 'Equipo MediaLab',
    event: 'Video Institucional',
    location: 'Campus Universidad Galileo',
    academicYear: '2024',
    videoType: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=6NxmtXUS0mA',
    videoId: '6NxmtXUS0mA'
  }
];

// Videos relacionados
const relatedVideos = [
  {
    id: 'relacionado-1',
    title: 'Conferencia de Tecnología FISICC 2024',
    thumbnail: '/api/placeholder/320/180',
    duration: '45:30',
    views: 8900,
    category: 'Conferencias',
    faculty: 'FISICC',
    publishedAt: '2024-03-05'
  },
  {
    id: 'relacionado-2',
    title: 'Graduación FACIMED 2024',
    thumbnail: '/api/placeholder/320/180',
    duration: '1:15:20',
    views: 15600,
    category: 'Graduaciones',
    faculty: 'FACIMED',
    publishedAt: '2024-02-20'
  },
  {
    id: 'relacionado-3',
    title: 'Reportaje: Investigación en FCEA',
    thumbnail: '/api/placeholder/320/180',
    duration: '22:15',
    views: 6700,
    category: 'Reportajes',
    faculty: 'FCEA',
    publishedAt: '2024-03-01'
  },
  {
    id: 'relacionado-4',
    title: 'Evento Cultural Universidad Galileo',
    thumbnail: '/api/placeholder/320/180',
    duration: '35:45',
    views: 9800,
    category: 'Eventos',
    faculty: 'Universidad Galileo',
    publishedAt: '2024-02-28'
  },
  {
    id: 'relacionado-5',
    title: 'Conferencia IDEA: Educación Online',
    thumbnail: '/api/placeholder/320/180',
    duration: '1:05:30',
    views: 7200,
    category: 'Conferencias',
    faculty: 'IDEA',
    publishedAt: '2024-03-08'
  }
];

// Comentarios de ejemplo
interface Comment {
  id: string;
  name: string;
  email: string;
  comment: string;
  date: string;
}

const sampleComments: Comment[] = [
  {
    id: '1',
    name: 'María González',
    email: 'maria@example.com',
    comment: '¡Excelente video! Me trae muchos recuerdos de mi graduación. Felicidades a todos los graduados.',
    date: '2024-03-15'
  },
  {
    id: '2',
    name: 'Carlos Méndez',
    email: 'carlos@example.com',
    comment: 'Muy emotivo. Universidad Galileo siempre brindando educación de calidad. ¡Orgulloso de ser egresado!',
    date: '2024-03-14'
  },
  {
    id: '3',
    name: 'Ana Lucía Herrera',
    email: 'ana@example.com',
    comment: 'Gracias por compartir este momento tan especial. La ceremonia estuvo hermosa.',
    date: '2024-03-13'
  }
];

export const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [newComment, setNewComment] = useState({
    name: '',
    email: '',
    comment: ''
  });

  useEffect(() => {
    // Simular carga de datos desde API
    setTimeout(() => {
      // Mapear IDs a videos específicos
      let selectedVideo: VideoData;
      
      switch (id) {
        case 'graduacion':
          selectedVideo = videoExamples[0];
          break;
        case 'reportaje':
          selectedVideo = videoExamples[1];
          break;
        case 'video-random':
          selectedVideo = videoExamples[2];
          break;
        default:
          // Para otros IDs, usar el primer video como fallback
          selectedVideo = videoExamples[0];
      }
      
      setVideo(selectedVideo);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleVideoClick = (clickedVideo: any) => {
    navigate(`/video/${clickedVideo.id}`);
  };

  const handleShare = async () => {
    if (navigator.share && video) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description?.substring(0, 100) + '...',
          url: window.location.href
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.name || !newComment.email || !newComment.comment) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      name: newComment.name,
      email: newComment.email,
      comment: newComment.comment,
      date: new Date().toISOString().split('T')[0]
    };

    setComments([comment, ...comments]);
    setNewComment({ name: '', email: '', comment: '' });
    alert('Comentario enviado exitosamente');
  };

  const formatViews = (views: number) => {
    if (views > 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views > 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <VideoLayout>
        <div className="w-full px-6 py-8">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-300 rounded-lg mb-6 max-w-6xl"></div>
            <div className="max-w-4xl">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </VideoLayout>
    );
  }

  if (!video) {
    return (
      <VideoLayout>
        <div className="w-full px-6 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Video no encontrado</h1>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </VideoLayout>
    );
  }

  return (
    <VideoLayout>
      <div className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
          
          {/* Columna Principal - Video y Detalles (3/4 del ancho en desktop) */}
          <div className="xl:col-span-3">
            
            {/* Video Player */}
            <div className="mb-6">
              <UniversalVideoPlayer
                video={video}
                autoplay={false}
                onPlay={() => console.log('Video iniciado')}
                onPause={() => console.log('Video pausado')}
                onEnded={() => console.log('Video terminado')}
                onTimeUpdate={(time) => console.log('Tiempo:', time)}
                className="w-full max-w-none"
              />
            </div>

            {/* Video Title */}
            <div className="mb-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {video.title}
              </h1>
              
              {/* Video Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  <span>{formatViews(video.views || 0)} visualizaciones</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  <span>{video.faculty}</span>
                </div>
                <div className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                  {video.category}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isLiked ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                <span className="text-sm font-medium">{isLiked ? 'Te gusta' : 'Me gusta'}</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSaved ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
                <span className="text-sm font-medium">{isSaved ? 'Guardado' : 'Guardar'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Compartir</span>
              </button>
            </div>

            {/* Description */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Descripción</h3>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                  >
                    {showFullDescription ? (
                      <>
                        <span>Ver menos</span>
                        <ChevronUpIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Ver más</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-700">
                  {video.description?.split('\n').map((paragraph, index) => {
                    if (!showFullDescription && index >= 3) return null;
                    return (
                      <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                    );
                  })}
                </div>

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                Comentarios ({comments.length})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newComment.name}
                      onChange={(e) => setNewComment({...newComment, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Correo
                    </label>
                    <input
                      type="email"
                      value={newComment.email}
                      onChange={(e) => setNewComment({...newComment, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentario
                  </label>
                  <textarea
                    value={newComment.comment}
                    onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Escribe tu comentario..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-accent-1 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Enviar comentario
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{comment.name}</h4>
                      <span className="text-sm text-gray-500">{formatDate(comment.date)}</span>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Videos Relacionados (1/4 del ancho en desktop) */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Videos relacionados</h3>
              <div className="space-y-3">
                {relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.id}
                    onClick={() => handleVideoClick(relatedVideo)}
                    className="flex gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={relatedVideo.thumbnail} 
                        alt={relatedVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                        {relatedVideo.duration}
                      </div>
                      <div className="absolute top-1 left-1 bg-accent-1 text-black px-2 py-1 rounded text-xs font-medium">
                        {relatedVideo.category}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm mb-2">
                        {relatedVideo.title}
                      </h4>
                      <p className="text-xs text-blue-600 font-medium mb-1">{relatedVideo.faculty}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatViews(relatedVideo.views)} vistas</span>
                        <span>•</span>
                        <span>{formatDate(relatedVideo.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VideoLayout>
  );
};