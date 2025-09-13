
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from 'lucide-react';

export default function TaskContactAssignment({
    suggestedRoles,
    assignedContacts,
    availableContacts,
    availableContactRoles, // new prop
    onSaveAssignedContacts,
    onAddNewContactRequest
}) {
    const handleAssignmentChange = (roleName, contactIndexStr) => {
        const contactIndex = contactIndexStr === 'unassign' ? null : parseInt(contactIndexStr);
        let newAssignments = [...(assignedContacts || [])];
        
        // Find existing assignment for this role
        const existingAssignmentIndex = newAssignments.findIndex(a => {
            const contact = availableContacts[a.contact_index];
            return contact && contact.role === roleName;
        });

        if (contactIndex !== null) {
            const selectedContact = availableContacts[contactIndex];
            const assignment = {
                contact_index: contactIndex,
                contact_name: selectedContact.name,
                contact_role: selectedContact.role,
            };
            if (existingAssignmentIndex > -1) {
                // Replace existing assignment for the role
                newAssignments[existingAssignmentIndex] = assignment;
            } else {
                // Add new assignment
                newAssignments.push(assignment);
            }
        } else {
            // Unassign: remove if exists
            if (existingAssignmentIndex > -1) {
                newAssignments.splice(existingAssignmentIndex, 1);
            }
        }

        onSaveAssignedContacts(newAssignments);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">שיוך אנשי קשר למשימה</h4>
                <Button variant="outline" size="sm" onClick={onAddNewContactRequest}>
                    <UserPlus className="ml-2 h-4 w-4" />
                    הוסף איש קשר חדש
                </Button>
            </div>
            {suggestedRoles && suggestedRoles.length > 0 ? (
                <div className="space-y-3 p-3 bg-gray-50 rounded-md border">
                    {suggestedRoles.map(roleName => { // changed from role to roleName
                        const relevantContacts = availableContacts.map((c, i) => ({ ...c, index: i })).filter(c => c.role === roleName);
                        
                        const currentAssignment = (assignedContacts || []).find(ac => {
                            const contact = availableContacts[ac.contact_index];
                            return contact && contact.role === roleName;
                        });

                        return (
                            <div key={roleName} className="grid grid-cols-3 items-center gap-4">
                                <label className="font-medium text-sm">{roleName}:</label>
                                <div className="col-span-2">
                                    <Select
                                        value={currentAssignment ? String(currentAssignment.contact_index) : undefined}
                                        onValueChange={(value) => handleAssignmentChange(roleName, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר איש קשר..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassign">
                                                <span className="text-red-500">בטל שיוך</span>
                                            </SelectItem>
                                            {relevantContacts.length > 0 ? relevantContacts.map(contact => (
                                                <SelectItem key={contact.index} value={String(contact.index)}>
                                                    {contact.name}
                                                </SelectItem>
                                            )) : (
                                                <div className="p-2 text-center text-sm text-gray-500">אין אנשי קשר עם תפקיד זה.</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-center text-gray-500 py-4">לא הוגדרו תפקידים מומלצים למשימה זו.</p>
            )}

            {assignedContacts && assignedContacts.length > 0 && (
                 <div>
                    <h5 className="text-sm font-semibold mb-2">שיוכים בפועל:</h5>
                     <div className="flex flex-wrap gap-2">
                        {assignedContacts.map((ac, index) => (
                             <Badge key={index} variant="secondary">{ac.contact_name} ({ac.contact_role})</Badge>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
}
