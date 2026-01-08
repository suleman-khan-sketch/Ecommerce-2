import { MdOutlineDashboard } from "react-icons/md";
import { LuUsers2 } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";
import { RiCoupon2Line } from "react-icons/ri";
import { TbTag } from "react-icons/tb";
import { TbBriefcase } from "react-icons/tb";
import { MdOutlineShoppingCart } from "react-icons/md";

export const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <MdOutlineDashboard />,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <MdOutlineShoppingCart />,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: <TbTag />,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: <LuUsers2 />,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: <TbTruckDelivery />,
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: <RiCoupon2Line />,
  },
  {
    title: "Staff",
    url: "/admin/staff",
    icon: <TbBriefcase />,
  },
];
