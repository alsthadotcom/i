export interface MarketplaceItem {
    id: number;
    title: string;
    category: string;
    price: string;
    roi: string;
    color: string;
    description: string;
    rating: number;
}

export const marketplaceItems: MarketplaceItem[] = [
    {
        id: 1,
        title: "Autonomous Drone Delivery Net",
        category: "Logistics",
        price: "$4.2M",
        roi: "+125%",
        color: "bg-blue-500",
        description: "Patent-pending mesh network for last-mile drone coordination in urban environments.",
        rating: 4.9
    },
    {
        id: 2,
        title: "Micro-Grid Energy Storage",
        category: "Energy",
        price: "$8.5M",
        roi: "+95%",
        color: "bg-green-500",
        description: "Decentralized battery storage units optimized for residential solar overflow.",
        rating: 4.7
    },
    {
        id: 3,
        title: "AI Legal Assistant SaaS",
        category: "SaaS",
        price: "$2.1M",
        roi: "+300%",
        color: "bg-purple-500",
        description: "Automated contract review and compliance checking for small businesses.",
        rating: 4.8
    },
    {
        id: 4,
        title: "Vertical Hydroponic Farms",
        category: "AgriTech",
        price: "$1.8M",
        roi: "+150%",
        color: "bg-yellow-500",
        description: "Modular farming units designed for urban rooftops and basements.",
        rating: 4.6
    }
];
