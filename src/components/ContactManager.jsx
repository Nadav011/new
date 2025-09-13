
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactRole } from '@/api/entities';

const ContactEditor = ({ contact, onSave, onCancel, availableRoles }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData(contact || { name: '', role: '', phone: '', email: '' });
    }, [contact]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>שם</Label><Input value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required /></div>
                <div>
                    <Label>תפקיד</Label>
                    <Select value={formData.role || ''} onValueChange={(value) => handleChange('role', value)} required>
                        <SelectTrigger><SelectValue placeholder="בחר תפקיד..." /></SelectTrigger>
                        <SelectContent>
                            {availableRoles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>טלפון נייד</Label><Input type="tel" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} required/></div>
                <div><Label>אימייל</Label><Input type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>ביטול</Button>
                <Button type="submit">שמור איש קשר</Button>
            </div>
        </form>
    );
};

export default function ContactManager({ open, onOpenChange, contacts, onSave, branchSetupId }) {
    const [managedContacts, setManagedContacts] = useState([]);
    const [editingContact, setEditingContact] = useState(null);
    const [availableRoles, setAvailableRoles] = useState([]);

    useEffect(() => {
        if (open) {
            setManagedContacts(contacts || []);
            loadRoles();
        }
    }, [open, contacts]);

    const loadRoles = async () => {
        // Assuming ContactRole is an entity that has a filter method and id/name properties
        // The current file had 'ContactRole' import but commented "Assuming ContactRole is not right for this context"
        // Based on the outline, it's now correct.
        const roles = await ContactRole.filter({is_active: true}, 'order_index');
        setAvailableRoles(roles);
    };

    const handleAdd = () => {
        setEditingContact(true); // true for new, object for edit
    };

    const handleEdit = (contact, index) => {
        setEditingContact({ ...contact, index });
    };

    const handleDelete = (index) => {
        if (window.confirm("האם למחוק את איש הקשר?")) {
            const updatedContacts = managedContacts.filter((_, i) => i !== index);
            setManagedContacts(updatedContacts);
        }
    };

    const handleSaveContact = (contactData) => {
        let updatedContacts;
        if (typeof editingContact === 'object' && editingContact.index !== undefined) {
            // Editing existing contact
            updatedContacts = [...managedContacts];
            const { index, ...originalContact } = editingContact;
            updatedContacts[index] = contactData;
        } else {
            // Adding new contact
            updatedContacts = [...managedContacts, contactData];
        }
        setManagedContacts(updatedContacts);
        setEditingContact(null);
    };

    const handleCloseEditor = () => {
        setEditingContact(null);
    };

    const handleSaveChanges = () => {
        onSave(managedContacts);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>ניהול אנשי קשר</DialogTitle>
                    <DialogDescription>הוסף, ערוך או הסר אנשי קשר עבור סניף זה.</DialogDescription>
                </DialogHeader>

                {editingContact ? (
                    <ContactEditor
                        contact={typeof editingContact === 'object' ? editingContact : null}
                        onSave={handleSaveContact}
                        onCancel={handleCloseEditor}
                        availableRoles={availableRoles}
                    />
                ) : (
                    <>
                        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {managedContacts.length > 0 ? managedContacts.map((contact, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{contact.name} <span className="text-sm font-normal text-gray-500">- {contact.role}</span></p>
                                        <p className="text-sm text-gray-600">{contact.phone} | {contact.email}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contact, index)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">לא נוספו אנשי קשר.</p>
                            )}
                        </div>
                        <div className="flex justify-start">
                            <Button variant="outline" onClick={handleAdd}>
                                <UserPlus className="ml-2 w-4 h-4" /> הוסף איש קשר
                            </Button>
                        </div>
                    </>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>סגור</Button>
                    <Button onClick={handleSaveChanges}>שמור שינויים וסגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
