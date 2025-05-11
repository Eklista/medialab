import React, { useState } from 'react';
import Card from '../../components/common/Card';

const ProfilePage: React.FC = () => {
  // Estado para el formulario
  const [formData, setFormData] = useState({
    firstName: 'Usuario',
    lastName: 'Colaborador',
    email: 'usuario@facultad.galileo.edu',
    phone: '+(502) 2423-8000',
    department: 'Facultad de Ingeniería',
    position: 'Coordinador Académico',
    bio: '',
    notifications: {
      email: true,
      browser: false
    }
  });

  // Actualizar campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en notificaciones
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los cambios
    alert('Perfil actualizado correctamente');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-4xl font-medium text-gray-600">
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {formData.firstName} {formData.lastName}
              </h3>
              <div className="mt-1 text-sm text-gray-500">
                {formData.position}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {formData.department}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cambiar foto
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500">Estadísticas</h4>
              <dl className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500">Solicitudes</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">12</dd>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500">Proyectos</dt>
                  <dd className="mt-1 text-xl font-semibold text-gray-900">5</dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Información Personal">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">El correo electrónico no se puede cambiar</p>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Departamento o Facultad
                  </label>
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Cargo o posición
                  </label>
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Biografía (opcional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Cuéntanos más sobre ti..."
                  ></textarea>
                </div>

                <div className="sm:col-span-6">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-700">Notificaciones</legend>
                    <div className="mt-2 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="email-notifications"
                            name="email"
                            type="checkbox"
                            checked={formData.notifications.email}
                            onChange={handleNotificationChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="email-notifications" className="font-medium text-gray-700">
                            Notificaciones por correo
                          </label>
                          <p className="text-gray-500">Recibe actualizaciones sobre tus solicitudes y proyectos por email.</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="browser-notifications"
                            name="browser"
                            type="checkbox"
                            checked={formData.notifications.browser}
                            onChange={handleNotificationChange}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="browser-notifications" className="font-medium text-gray-700">
                            Notificaciones del navegador
                          </label>
                          <p className="text-gray-500">Recibe notificaciones mientras estás usando el portal.</p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;