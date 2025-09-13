import React from 'react';
import { 
    Store, Building, Building2, Home, MapPin, 
    UtensilsCrossed, Coffee, Utensils, Pizza, Soup,
    Crown, Star, Award, Trophy, Medal,
    ShoppingBag, ShoppingCart, Package, Gift,
    Heart, Smile, ThumbsUp, CheckCircle, Circle,
    Mountain, Sun, Moon, Flower, TreePine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IconShowcase() {
    const iconCategories = [
        {
            title: "מבנים ומקומות",
            icons: [
                { name: "Store", component: Store },
                { name: "Building", component: Building },
                { name: "Building2", component: Building2 },
                { name: "Home", component: Home },
                { name: "MapPin", component: MapPin },
            ]
        },
        {
            title: "מזון ומסעדות",
            icons: [
                { name: "UtensilsCrossed", component: UtensilsCrossed },
                { name: "Coffee", component: Coffee },
                { name: "Utensils", component: Utensils },
                { name: "Pizza", component: Pizza },
                { name: "Soup", component: Soup },
            ]
        },
        {
            title: "הצטיינות ופרסים",
            icons: [
                { name: "Crown", component: Crown },
                { name: "Star", component: Star },
                { name: "Award", component: Award },
                { name: "Trophy", component: Trophy },
                { name: "Medal", component: Medal },
            ]
        },
        {
            title: "קניות ומסחר",
            icons: [
                { name: "ShoppingBag", component: ShoppingBag },
                { name: "ShoppingCart", component: ShoppingCart },
                { name: "Package", component: Package },
                { name: "Gift", component: Gift },
            ]
        },
        {
            title: "רגשות וסטטוס",
            icons: [
                { name: "Heart", component: Heart },
                { name: "Smile", component: Smile },
                { name: "ThumbsUp", component: ThumbsUp },
                { name: "CheckCircle", component: CheckCircle },
                { name: "Circle", component: Circle },
            ]
        },
        {
            title: "טבע ונוף",
            icons: [
                { name: "Mountain", component: Mountain },
                { name: "Sun", component: Sun },
                { name: "Moon", component: Moon },
                { name: "Flower", component: Flower },
                { name: "TreePine", component: TreePine },
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">מערך האייקונים הזמין</h1>
            {iconCategories.map(category => (
                <Card key={category.title}>
                    <CardHeader>
                        <CardTitle>{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                            {category.icons.map(({ name, component: IconComponent }) => (
                                <div key={name} className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50">
                                    <IconComponent className="w-6 h-6 text-gray-700 mb-2" />
                                    <span className="text-xs text-center">{name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}