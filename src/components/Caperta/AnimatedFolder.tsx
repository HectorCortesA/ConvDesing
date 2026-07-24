import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface AnimatedFolderProps {
    name: string;
    itemCount: number;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

export function AnimatedFolder({ name, itemCount, onClick, onDelete, onDragOver, onDragLeave, onDrop }: AnimatedFolderProps) {
    return (
        <div 
            className="flex flex-col items-center justify-center p-4 relative group w-full h-full"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Botón eliminar */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                }}
                className="absolute top-3 right-3 p-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all z-30"
                title="Eliminar carpeta"
            >
                <Trash2 size={14} />
            </button>

            <motion.div
                onClick={onClick}
                className="relative w-[135px] h-[95px] cursor-pointer group/folder scale-[1.3] transform origin-center"
                whileHover="hover"
                initial="initial"
            >
                {/* Parte trasera de la carpeta (Fondo) */}
                <div className="absolute inset-0 bg-zinc-800/30 rounded-[17px]" />

                {/* Contenedor máscara: permite que salgan por arriba pero los recorta exactamente por abajo */}
                <div className="absolute bottom-0 left-0 w-full h-[200px] overflow-hidden rounded-b-[17px] pointer-events-none z-0">
                    {/* Archivos / Elementos interiores */}
                    <motion.div
                        className="absolute left-0 bottom-0 w-[133px] pointer-events-none z-0"
                        variants={{
                            initial: { y: 0 },
                            hover: { y: -45, transition: { type: 'spring', stiffness: 300, damping: 20 } }
                        }}
                    >
                        {/* Group Original */}
                        <div className="absolute h-[61px] left-0 bottom-[10px] w-[133px]">
                            <svg className="absolute block inset-0 size-full drop-shadow-md" fill="none" height="61" preserveAspectRatio="none" viewBox="0 0 133 61" width="133">
                                <g id="Group 1">
                                    <ellipse cx="17.5" cy="41.5" fill="#716E6E" id="Ellipse 1" rx="17.5" ry="16.5" />
                                    <ellipse cx="115.5" cy="44.5" fill="#60BACC" id="Ellipse 9" rx="17.5" ry="16.5" />
                                    <ellipse cx="91.5" cy="38.5" fill="#4E9E76" id="Ellipse 2" rx="17.5" ry="16.5" />
                                    <ellipse cx="106.5" cy="19.5" fill="#769CEE" id="Ellipse 8" rx="17.5" ry="16.5" />
                                    <ellipse cx="56.5" cy="16.5" fill="#812727" id="Ellipse 3" rx="17.5" ry="16.5" />
                                    <ellipse cx="67.5" cy="38.5" fill="#8BC6A2" id="Ellipse 6" rx="17.5" ry="16.5" />
                                    <ellipse cx="82.5" cy="16.5" fill="#DACE96" id="Ellipse 7" rx="17.5" ry="16.5" />
                                    <ellipse cx="32.5" cy="18.5" fill="#AE5959" id="Ellipse 4" rx="17.5" ry="16.5" />
                                    <ellipse cx="44.5" cy="35.5" fill="#6752AE" id="Ellipse 5" rx="17.5" ry="16.5" />
                                </g>
                            </svg>
                        </div>

                        {/* Group 1 Original (Escalado -y) */}
                        <div className="absolute flex h-[72px] items-center justify-center left-0 bottom-[-5px] w-[133px]">
                            <div className="-scale-y-100 flex-none drop-shadow-md">
                                <div className="h-[72px] relative w-[133px]">
                                    <svg className="absolute block inset-0 size-full" fill="none" height="72" preserveAspectRatio="none" viewBox="0 0 133 72" width="133">
                                        <g id="Group 2">
                                            <ellipse cx="17.5" cy="48.9836" fill="#716E6E" id="Ellipse 1" rx="17.5" ry="19.4754" />
                                            <ellipse cx="115.5" cy="52.5246" fill="#60BACC" id="Ellipse 9" rx="17.5" ry="19.4754" />
                                            <ellipse cx="91.5" cy="45.4426" fill="#4E9E76" id="Ellipse 2" rx="17.5" ry="19.4754" />
                                            <ellipse cx="106.5" cy="23.0164" fill="#769CEE" id="Ellipse 8" rx="17.5" ry="19.4754" />
                                            <ellipse cx="56.5" cy="19.4754" fill="#812727" id="Ellipse 3" rx="17.5" ry="19.4754" />
                                            <ellipse cx="67.5" cy="45.4426" fill="#8BC6A2" id="Ellipse 6" rx="17.5" ry="19.4754" />
                                            <ellipse cx="82.5" cy="19.4754" fill="#DACE96" id="Ellipse 7" rx="17.5" ry="19.4754" />
                                            <ellipse cx="32.5" cy="21.8361" fill="#AE5959" id="Ellipse 4" rx="17.5" ry="19.4754" />
                                            <ellipse cx="44.5" cy="41.9016" fill="#6752AE" id="Ellipse 5" rx="17.5" ry="19.4754" />
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Cobertura translúcida frontal (Glassmorphism) */}
                <div className="absolute z-10 backdrop-blur-[2px] bg-[rgba(34,33,33,0.85)] h-[95px] left-0 rounded-tl-[17px] rounded-tr-[17px] top-0 w-[135px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors group-hover/folder:bg-[rgba(40,40,40,0.85)] flex flex-col items-center justify-center p-2">
                    <span className="text-white/20 font-bold text-2xl group-hover/folder:text-white/40 transition-colors leading-none">
                        {itemCount}
                    </span>
                    <span className="text-zinc-300 font-semibold text-xs group-hover/folder:text-white transition-colors truncate w-full text-center mt-1">
                        {name}
                    </span>
                </div>

                {/* Borde inferior para dar un mejor acabado visual a la base */}
                <div className="absolute z-20 bottom-0 left-0 w-[135px] h-[3px] bg-zinc-800 rounded-b-[17px]" />
            </motion.div>
        </div>
    );
}
