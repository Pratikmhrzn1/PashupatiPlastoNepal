import { FaWhatsapp } from "react-icons/fa6";

export default function FloatingContactButton() {
  const whatsappNumber = "9849966097";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-6">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:scale-105 hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-95"
      >
        <FaWhatsapp className="h-7 w-7" />
      </a>
    </div>
  );
}
