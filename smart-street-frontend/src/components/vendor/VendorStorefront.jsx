import React, { useState, useEffect } from "react";
import {
    PhotoIcon,
    ListBulletIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ShoppingBagIcon
} from "@heroicons/react/24/outline";
import api from "../../services/api";

export default function VendorStorefront() {
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState("");
    const [category, setCategory] = useState("");
    const [stallPhoto, setStallPhoto] = useState("");
    const [menuItems, setMenuItems] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");

    useEffect(() => {
        fetchVendor();
    }, []);

    const fetchVendor = async () => {
        try {
            const res = await api.get("/auth/me"); // Assuming this returns vendor info or we fetch from vendor repo
            // Ideally we need a dedicated /vendor/profile endpoint
            const vendorData = res.data.user;
            // Fetching from /vendor/storefront if it exists or use auth me
            // For now, let's assume we have the vendor object
            setVendor(vendorData);
            setBusinessName(vendorData.business_name || "");
            setCategory(vendorData.category || "");
            setStallPhoto(vendorData.stall_photo || "");
            setMenuItems(vendorData.menu_items || []);
        } catch (err) {
            console.error("Failed to fetch vendor storefront", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice) return;
        setMenuItems([...menuItems, { name: newItemName, price: newItemPrice }]);
        setNewItemName("");
        setNewItemPrice("");
    };

    const handleRemoveItem = (index) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/vendor/storefront", {
                businessName,
                category,
                stallPhoto,
                menuItems
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading storefront...</div>;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Digital Storefront</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Manage how your stall appears to citizens on the public map.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {saving ? "Saving..." : saved ? <><CheckCircleIcon className="w-5 h-5" /> Saved</> : "Save Changes"}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Basic Info */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingBagIcon className="w-5 h-5 text-blue-500" />
                        Stall Identity
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Business Name</label>
                            <input
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                placeholder="Name of your stall"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                                <option value="Food">Street Food</option>
                                <option value="Beverage">Beverages</option>
                                <option value="Apparel">Apparel & Textiles</option>
                                <option value="Accessory">Accessories</option>
                                <option value="Produce">Fresh Produce</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Stall Photo URL</label>
                            <div className="flex gap-4">
                                <input
                                    value={stallPhoto}
                                    onChange={e => setStallPhoto(e.target.value)}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden">
                        {stallPhoto ? (
                            <img src={stallPhoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <PhotoIcon className="w-12 h-12 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">Photo Preview</p>
                            </>
                        )}
                    </div>
                </section>

                {/* Menu Items */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ListBulletIcon className="w-5 h-5 text-blue-500" />
                        Menu / Items List
                    </h2>

                    <form onSubmit={handleAddItem} className="flex gap-2">
                        <input
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Item name"
                        />
                        <input
                            value={newItemPrice}
                            onChange={e => setNewItemPrice(e.target.value)}
                            className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Price (₹)"
                        />
                        <button
                            type="submit"
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-xl"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden min-h-[300px]">
                        {menuItems.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {menuItems.map((item, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-900 dark:text-white">₹{item.price}</span>
                                            <button
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 italic">No items listed. Tell your customers what you have!</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
