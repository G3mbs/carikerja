/**
 * Auto-Fill Indicator Component
 * 
 * Komponen untuk menampilkan visual indicator bahwa field telah di-auto-fill
 * berdasarkan analisis CV dengan tooltip informasi
 */

'use client'

import { useState } from 'react'
import { CheckCircle, Info, Sparkles, User, MapPin, DollarSign, Briefcase } from 'lucide-react'

interface AutoFillIndicatorProps {
  isAutoFilled: boolean
  field: 'keywords' | 'location' | 'salaryRange' | 'experienceLevel'
  tooltip: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function AutoFillIndicator({ 
  isAutoFilled, 
  field, 
  tooltip, 
  className = '',
  size = 'sm'
}: AutoFillIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!isAutoFilled) {
    return null
  }

  const getFieldIcon = () => {
    const iconProps = {
      className: `${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`
    }

    switch (field) {
      case 'keywords':
        return <Sparkles {...iconProps} />
      case 'location':
        return <MapPin {...iconProps} />
      case 'salaryRange':
        return <DollarSign {...iconProps} />
      case 'experienceLevel':
        return <Briefcase {...iconProps} />
      default:
        return <CheckCircle {...iconProps} />
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'md':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-4 py-2 text-base'
      default:
        return 'px-2 py-1 text-xs'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center space-x-1 bg-green-100 text-green-800 rounded-full font-medium
          border border-green-200 cursor-help transition-all hover:bg-green-200
          ${getSizeClasses()}
          ${className}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getFieldIcon()}
        <span>Auto</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Auto-Fill Badge Component
 * Badge yang lebih prominent untuk menunjukkan bahwa form telah di-auto-fill
 */
interface AutoFillBadgeProps {
  autoFilledFields: string[]
  totalFields: number
  source: 'cv_analysis' | 'default' | 'mixed'
  className?: string
}

export function AutoFillBadge({ 
  autoFilledFields, 
  totalFields, 
  source,
  className = '' 
}: AutoFillBadgeProps) {
  if (autoFilledFields.length === 0) {
    return null
  }

  const getSourceInfo = () => {
    switch (source) {
      case 'cv_analysis':
        return {
          icon: <User className="h-4 w-4" />,
          text: 'Berdasarkan CV Anda',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        }
      case 'mixed':
        return {
          icon: <Sparkles className="h-4 w-4" />,
          text: 'Sebagian dari CV',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        }
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          text: 'Nilai Default',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        }
    }
  }

  const sourceInfo = getSourceInfo()
  const percentage = Math.round((autoFilledFields.length / totalFields) * 100)

  return (
    <div className={`
      inline-flex items-center space-x-2 px-3 py-2 rounded-lg border
      ${sourceInfo.bgColor} ${sourceInfo.textColor} ${sourceInfo.borderColor}
      ${className}
    `}>
      {sourceInfo.icon}
      <span className="text-sm font-medium">
        {sourceInfo.text}
      </span>
      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
        {autoFilledFields.length}/{totalFields} field ({percentage}%)
      </span>
    </div>
  )
}

/**
 * Auto-Fill Summary Component
 * Komponen untuk menampilkan ringkasan auto-fill di bagian atas form
 */
interface AutoFillSummaryProps {
  isAutoFilled: boolean
  autoFilledFields: string[]
  source: 'cv_analysis' | 'default' | 'mixed'
  onReset?: () => void
  className?: string
}

export function AutoFillSummary({ 
  isAutoFilled, 
  autoFilledFields, 
  source,
  onReset,
  className = '' 
}: AutoFillSummaryProps) {
  if (!isAutoFilled) {
    return null
  }

  const getFieldDisplayName = (field: string) => {
    const names = {
      keywords: 'Kata Kunci',
      location: 'Lokasi',
      salaryRange: 'Rentang Gaji',
      experienceLevel: 'Level Pengalaman'
    }
    return names[field as keyof typeof names] || field
  }

  const getSourceMessage = () => {
    switch (source) {
      case 'cv_analysis':
        return 'Parameter pencarian telah diisi berdasarkan analisis CV Anda'
      case 'mixed':
        return 'Beberapa parameter diisi dari CV, sisanya menggunakan nilai default'
      default:
        return 'Parameter menggunakan nilai default'
    }
  }

  return (
    <div className={`
      bg-green-50 border border-green-200 rounded-lg p-4 mb-6
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800 mb-1">
              Parameter Terisi Otomatis
            </h4>
            <p className="text-sm text-green-700 mb-2">
              {getSourceMessage()}
            </p>
            <div className="flex flex-wrap gap-2">
              {autoFilledFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                >
                  {getFieldDisplayName(field)}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {onReset && (
          <button
            onClick={onReset}
            className="text-sm text-green-700 hover:text-green-900 underline flex-shrink-0"
          >
            Reset ke Default
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Field Label with Auto-Fill Indicator
 * Label field yang sudah include auto-fill indicator
 */
interface FieldLabelProps {
  label: string
  isAutoFilled: boolean
  field: 'keywords' | 'location' | 'salaryRange' | 'experienceLevel'
  tooltip: string
  required?: boolean
  className?: string
}

export function FieldLabel({ 
  label, 
  isAutoFilled, 
  field, 
  tooltip, 
  required = false,
  className = '' 
}: FieldLabelProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <AutoFillIndicator
        isAutoFilled={isAutoFilled}
        field={field}
        tooltip={tooltip}
      />
    </div>
  )
}
