// src/pages/documentation/ComponentsTest.tsx
import React, { useState } from 'react';
import { Navbar, Footer } from '../../components/layout';

// Tipos de solicitud para las pestañas
type RequestTab = 'recurrente' | 'unica' | 'podcast' | 'curso';

const ComponentsTest: React.FC = () => {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<RequestTab>('recurrente');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Inter', 'Poppins', sans-serif]">
      <Navbar />
      
      <main className="flex-grow">
        <div className="py-10">
          <header className="mb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Estructura del Formulario de Solicitud</h1>
              <p className="mt-2 text-lg text-gray-600">Campos por paso del formulario para el sistema de solicitud de servicios MediaLab</p>
            </div>
          </header>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {/* Paso 1 */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center">
                    <span className="flex items-center justify-center bg-purple-600 text-white rounded-full w-8 h-8 mr-3">1</span>
                    Paso 1: Tipo de Solicitud
                  </h2>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requestType</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            Selección del tipo de solicitud:
                            <ul className="list-disc pl-5 mt-1">
                              <li>Solicitud Recurrente</li>
                              <li>Solicitud Única</li>
                              <li>Podcast</li>
                              <li>Curso</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              
              {/* Paso 2 */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center">
                    <span className="flex items-center justify-center bg-purple-600 text-white rounded-full w-8 h-8 mr-3">2</span>
                    Paso 2: Selección de Servicios
                  </h2>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">selectedTemplate</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Plantilla para preseleccionar servicios</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">selectedCategories</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Checkbox múltiple</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Categorías de servicios</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">services</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Checkbox múltiple</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Servicios específicos seleccionados</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              
              {/* Paso 3 - Tabs para cada tipo */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center">
                    <span className="flex items-center justify-center bg-purple-600 text-white rounded-full w-8 h-8 mr-3">3</span>
                    Paso 3: Detalles específicos (según tipo de solicitud)
                  </h2>
                  
                  {/* Tabs para cada tipo de solicitud */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button 
                        className={`${activeTab === 'recurrente' ? 'border-lime-500 text-lime-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        onClick={() => setActiveTab('recurrente')}
                      >
                        Solicitud Recurrente
                      </button>
                      <button 
                        className={`${activeTab === 'unica' ? 'border-lime-500 text-lime-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        onClick={() => setActiveTab('unica')}
                      >
                        Solicitud Única
                      </button>
                      <button 
                        className={`${activeTab === 'podcast' ? 'border-lime-500 text-lime-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        onClick={() => setActiveTab('podcast')}
                      >
                        Podcast
                      </button>
                      <button 
                        className={`${activeTab === 'curso' ? 'border-lime-500 text-lime-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        onClick={() => setActiveTab('curso')}
                      >
                        Curso
                      </button>
                    </nav>
                  </div>
                  
                  {/* Sección de Actividad Recurrente */}
                  {activeTab === 'recurrente' && (
                    <div className="mt-4">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">activityName</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Nombre de la actividad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">faculty</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Facultad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">recurrenceType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Patrón de recurrencia (diario, semanal, mensual, manual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">weekDays</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Checkbox múltiple</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Días de la semana (si es semanal)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">manualDates</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Array de fechas</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fechas específicas (si es manual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Ubicación (universidad, externa, virtual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text/Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles de ubicación</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">additionalDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles adicionales (opcional)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Sección de Actividad Única */}
                  {activeTab === 'unica' && (
                    <div className="mt-4">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">activityName</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Nombre de la actividad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">faculty</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Facultad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de la actividad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Ubicación (universidad, externa, virtual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text/Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles de ubicación</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">additionalDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles adicionales (opcional)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Sección de Podcast */}
                  {activeTab === 'podcast' && (
                    <div className="mt-4">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">activityName</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Nombre del podcast</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">faculty</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Facultad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">isRecurring</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Checkbox</td>
                              <td className="px-3 py-4 text-sm text-gray-500">¿Es un podcast recurrente?</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">recurrenceType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Si es recurrente: diario, semanal, mensual, manual</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Ubicación (universidad, externa, virtual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text/Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles de ubicación</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">moderators</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Array de strings</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Lista de moderadores</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">episodes</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Array de objetos</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Lista de episodios con detalles</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">additionalDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles adicionales (opcional)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Sección de Curso */}
                  {activeTab === 'curso' && (
                    <div className="mt-4">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">careerName</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Nombre de la carrera</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">careerName</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Nombre de la carrera</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">faculty</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Facultad</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endDate</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Date</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fecha de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">startTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de inicio</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">endTime</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Time</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Hora de fin</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">recurrenceType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Patrón de recurrencia (diario, semanal, mensual, manual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">weekDays</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Checkbox múltiple</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Días de la semana (si es semanal)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">monthDay</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Select</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Día del mes (si es mensual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">manualDates</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Array de fechas</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Fechas específicas (si es manual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationType</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Radio</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Ubicación (universidad, externa, virtual)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">locationDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text/Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles de ubicación</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">courses</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Array de objetos</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Lista de cursos con detalles (nombre, cantidad de clases, horario)</td>
                            </tr>
                            <tr>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">additionalDetails</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Textarea</td>
                              <td className="px-3 py-4 text-sm text-gray-500">Detalles adicionales (opcional)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              
              {/* Paso 4 */}
              <section>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6 pb-2 border-b flex items-center">
                    <span className="flex items-center justify-center bg-purple-600 text-white rounded-full w-8 h-8 mr-3">4</span>
                    Paso 4: Información del Solicitante y Revisión
                  </h2>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requesterInfo.name</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Nombre completo del solicitante</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requesterInfo.email</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Email</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Correo electrónico</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requesterInfo.phone</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Tel</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Teléfono</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requesterInfo.department</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Text</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Departamento o área</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">requesterInfo.notes</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Textarea</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Notas adicionales (opcional)</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">[Resumen de la solicitud]</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Informativo</td>
                          <td className="px-3 py-4 text-sm text-gray-500">Resumen de los datos seleccionados en pasos anteriores</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
export default ComponentsTest;