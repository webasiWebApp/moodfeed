import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const filters = [
  'None',
  'Vintage',
  'Noir',
  'Retro',
  'Cool',
  'Warm',
  'Sepia',
  'Grayscale',
  'Aden',
  'Clarendon',
  'Gingham',
  'Juno',
  'Lark',
  'Ludwig',
  'Mayfair',
  'Perpetua',
  'Reyes',
  'Slumber',
  'Willow',
];

const CreateStatus: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('None');
  const videoRef = useRef<HTMLVideoElement>(null);

  // In a real implementation, you would use navigator.mediaDevices.getUserMedia to access the camera
  // and stream it to the video element. For this example, we'll use a placeholder.

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
      <Button className="absolute top-4 right-4" variant="ghost" size="icon" onClick={() => navigate('/')}>
        <X className="w-6 h-6" />
      </Button>
      <div className="relative w-full h-full flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
        <div className={`absolute inset-0 w-full h-full mix-blend-multiply ${selectedFilter.toLowerCase()}`}>
          {/* Placeholder for camera view */}
          <div className="bg-gray-800 w-full h-full flex items-center justify-center">
            <p className="text-2xl text-gray-400">Camera View</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-16 w-full overflow-x-auto scrolling-touch">
        <div className="flex space-x-4 px-4">
          {filters.map(filter => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'secondary' : 'ghost'}
              onClick={() => setSelectedFilter(filter)}
              className="flex-shrink-0"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 flex items-center justify-center">
        <Button variant="outline" size="icon" className="w-16 h-16 rounded-full border-4 border-white">
          <Camera className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};

export default CreateStatus;
