import { Button } from '@/components/Button'
import { Input, PasswordInput } from '@/components/Input'
import { Card, CardBody, CardHeader } from '@/components/UI'
import { useAuth } from '@/hooks'
import type { RegisterRequest } from '@/types'
import { isValidEmail, validatePassword } from '@/utils'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error } = useAuth()

  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong'
    requirements: any
  }>({ strength: 'weak', requirements: {} })

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    // 用户名验证
    if (!formData.username) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要 3 个字符'
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过 20 个字符'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线'
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = '密码强度不足，请参考密码要求'
      }
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    // 协议同意验证
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '请同意服务条款'
    }

    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = '请同意隐私政策'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await register(formData)
      navigate('/dashboard')
    } catch (error) {
      // 错误已在 useAuth hook 中处理
    }
  }

  // 处理输入变化
  const handleChange = (field: keyof RegisterRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // 密码强度检查
    if (field === 'password' && typeof value === 'string') {
      const strength = validatePassword(value)
      setPasswordStrength(strength)
    }
  }

  // 密码强度指示器
  const PasswordStrengthIndicator = () => {
    const { strength, requirements } = passwordStrength

    const strengthColors = {
      weak: 'bg-red-500',
      medium: 'bg-yellow-500',
      strong: 'bg-green-500',
    }

    const strengthTexts = {
      weak: '弱',
      medium: '中',
      strong: '强',
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">密码强度:</span>
          <div className="flex space-x-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`w-2 h-2 rounded-full ${
                  (strength === 'weak' && level === 1) ||
                  (strength === 'medium' && level <= 2) ||
                  (strength === 'strong' && level <= 3)
                    ? strengthColors[strength]
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {strengthTexts[strength]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(requirements).map(([key, met]) => {
            const labels = {
              length: '至少 8 个字符',
              uppercase: '包含大写字母',
              lowercase: '包含小写字母',
              number: '包含数字',
              special: '包含特殊字符',
            }

            return (
              <div
                key={key}
                className={`flex items-center space-x-1 ${
                  met ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                <span>{met ? '✓' : '○'}</span>
                <span>{labels[key as keyof typeof labels]}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* 头部 Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">
            QuantConsole
          </h1>
          <p className="text-gray-400 mt-2">
            加入专业的加密货币交易平台
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-100">
              创建账户
            </h2>
            <p className="text-gray-400 mt-1">
              填写以下信息完成注册
            </p>
          </CardHeader>

          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="邮箱地址"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                placeholder="请输入您的邮箱地址"
                autoComplete="email"
                required
              />

              <Input
                label="用户名"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                error={errors.username}
                placeholder="3-20 个字符，仅限字母数字和下划线"
                autoComplete="username"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="名字"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="请输入您的名字"
                  autoComplete="given-name"
                />

                <Input
                  label="姓氏"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="请输入您的姓氏"
                  autoComplete="family-name"
                />
              </div>

              <PasswordInput
                label="密码"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                placeholder="请输入密码"
                autoComplete="new-password"
                required
              />

              {formData.password && <PasswordStrengthIndicator />}

              <PasswordInput
                label="确认密码"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                showToggle={false}
                required
              />

              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">
                    我已阅读并同意{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-primary-400 hover:text-primary-300"
                    >
                      服务条款
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-red-400 text-sm ml-6">{errors.agreeToTerms}</p>
                )}

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeToPrivacy}
                    onChange={(e) => handleChange('agreeToPrivacy', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">
                    我已阅读并同意{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="text-primary-400 hover:text-primary-300"
                    >
                      隐私政策
                    </Link>
                  </span>
                </label>
                {errors.agreeToPrivacy && (
                  <p className="text-red-400 text-sm ml-6">{errors.agreeToPrivacy}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                创建账户
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                已有账户？{' '}
                <Link
                  to="/auth/login"
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 安全承诺 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            我们采用银行级安全措施保护您的账户和资产安全，
            您的个人信息将得到严格保护。
          </p>
        </div>
      </div>
    </div>
  )
}
