import React from 'react';
import { BedDouble, Bath, Users, MapPin, MoreVertical, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import type { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onToggleStatus,
}) => {
  const channelLabels: Record<string, string> = {
    airbnb: 'Airbnb',
    ctrip: '携程',
    meituan: '美团',
    xiaohongshu: '小红书',
  };

  const activeChannels = property.channels.filter(c => c.enabled);

  return (
    <Card hoverable className="overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <img
          src={property.coverImage}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Tag variant={property.status === 'active' ? 'success' : 'default'}>
            {property.status === 'active' ? '运营中' : '已下架'}
          </Tag>
        </div>
        <div className="absolute top-3 left-3 flex gap-1">
          {activeChannels.slice(0, 3).map(channel => (
            <Tag key={channel.id} variant="info" size="sm">
              {channelLabels[channel.platform]}
            </Tag>
          ))}
          {activeChannels.length > 3 && (
            <Tag variant="default" size="sm">+{activeChannels.length - 3}</Tag>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{property.name}</h3>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{property.maxGuests}人</span>
          </div>
          <div className="flex items-center gap-1">
            <BedDouble className="w-4 h-4" />
            <span>{property.bedrooms}卧</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms}卫</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Wifi className="w-4 h-4" />
            <span className="font-mono">{property.wifiPassword}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              编辑
            </Button>
            <Button
              size="sm"
              variant={property.status === 'active' ? 'danger' : 'primary'}
              onClick={onToggleStatus}
            >
              {property.status === 'active' ? '下架' : '上架'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
