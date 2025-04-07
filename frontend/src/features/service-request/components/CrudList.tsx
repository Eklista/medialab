// src/features/service-request/components/CrudList.tsx
import React, { useState } from 'react';
import Button from './Button';
import InputWithButton from './InputWithButton';
import Modal from './Modal';
import TextInput from './TextInput';
import Select from './Select';
import Textarea from './TextArea';
import { SelectOption } from './Select';

export interface CrudItem {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CrudListProps<T extends CrudItem> {
  items: T[];
  onAddItem: (item: Omit<T, 'id'>) => void;
  onUpdateItem: (id: string, item: Partial<T>) => void;
  onDeleteItem: (id: string) => void;
  addButtonText?: string;
  emptyMessage?: string;
  title?: string;
  validateInput?: (value: string) => string | null;
  additionalFields?: {
    name: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'select' | 'textarea';
    options?: SelectOption[];
    required?: boolean;
  }[];
  className?: string;
}

function CrudList<T extends CrudItem>({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  addButtonText = 'Agregar',
  emptyMessage = 'No hay elementos',
  title = 'Lista de elementos',
  validateInput,
  additionalFields = [],
  className = '',
}: CrudListProps<T>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
  });
  
  // Reset form when modal closes
  const resetForm = () => {
    setFormData({ name: '' });
    additionalFields.forEach((field) => {
      setFormData((prev) => ({ ...prev, [field.name]: '' }));
    });
    setEditingItem(null);
  };
  
  const handleOpenModal = (item?: T) => {
    if (item) {
      setEditingItem(item);
      // Populate form with item data
      setFormData({ name: item.name });
      additionalFields.forEach((field) => {
        setFormData((prev) => ({ ...prev, [field.name]: item[field.name] || '' }));
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleQuickAdd = (name: string) => {
    // Create a basic item with just the name and cast to proper type
    const newItemData = { name } as unknown as Omit<T, 'id'>;
    onAddItem(newItemData);
  };
  
  const handleSubmitForm = () => {
    if (editingItem) {
      // Update existing item - need to cast formData to make TypeScript happy
      onUpdateItem(editingItem.id, formData as unknown as Partial<T>);
    } else {
      // Add new item with all form fields
      onAddItem(formData as unknown as Omit<T, 'id'>);
    }
    handleCloseModal();
  };
  
  // Renderizar un campo según su tipo
  const renderField = (field: NonNullable<CrudListProps<T>['additionalFields']>[0]) => {
    if (field.type === 'select' && field.options) {
      return (
        <Select
          key={field.name}
          id={`item-${field.name}`}
          name={field.name}
          label={field.label}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          options={field.options}
          placeholder={field.placeholder || `Seleccione ${field.label.toLowerCase()}`}
          required={field.required}
        />
      );
    } else if (field.type === 'textarea') {
      return (
        <Textarea
          key={field.name}
          id={`item-${field.name}`}
          name={field.name}
          label={field.label}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    } else {
      return (
        <TextInput
          key={field.name}
          id={`item-${field.name}`}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          type={field.type as 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | undefined}
          value={formData[field.name] || ''}
          onChange={handleInputChange}
          required={field.required}
        />
      );
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-lg font-medium text-black">{title}</h3>}
      
      {/* Quick add form */}
      <InputWithButton
        id="quick-add-item"
        name="quick-add-item"
        placeholder="Nombre del elemento"
        buttonText={addButtonText}
        onAdd={handleQuickAdd}
        validateInput={validateInput}
        buttonIcon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        }
      />
      
      {/* Items list */}
      <div className="mt-4">
        {items.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4 bg-white">
                <span className="font-medium text-black">{item.name}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => handleOpenModal(item)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => onDeleteItem(item.id)}
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
      
      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Editar Elemento' : 'Agregar Elemento'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitForm}>
              {editingItem ? 'Actualizar' : 'Agregar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput
            id="item-name"
            name="name"
            label="Nombre"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          {/* Render additional fields */}
          {additionalFields.map(renderField)}
        </div>
      </Modal>
      
      {/* Button to show full modal with additional fields */}
      {additionalFields.length > 0 && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenModal()}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Agregar con detalles
          </Button>
        </div>
      )}
    </div>
  );
}

export default CrudList;