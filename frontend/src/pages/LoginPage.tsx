import { Button } from '@/components/Button'
import { Input, PasswordInput } from '@/components/Input'
import { Card, CardBody, CardHeader } from '@/components/UI'
import { useAuth } from '@/hooks'
import type { LoginRequest } from '@/types'
import { isValidEmail } from '@/utils'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    rememberMe: false,
    twoFactorCode: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTwoFactor, setShowTwoFactor] = useState(false)

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    }

    if (showTwoFactor && !formData.twoFactorCode) {
      newErrors.twoFactorCode = '请输入双因素认证代码'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await login(formData)
      navigate('/dashboard')
    } catch (error: any) {
      // 检查是否需要双因素认证
      if (error.message?.includes('2FA') || error.message?.includes('双因素')) {
        setShowTwoFactor(true)
      }
    }
  }

  // 处理输入变化
  const handleChange = (field: keyof LoginRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* 头部 Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">
            QuantConsole
          </h1>
          <p className="text-gray-400 mt-2">
            专业的加密货币交易控制台
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-100">
              {showTwoFactor ? '双因素认证' : '登录账户'}
            </h2>
            <p className="text-gray-400 mt-1">
              {showTwoFactor
                ? '请输入您的双因素认证代码'
                : '请输入您的登录凭据'
              }
            </p>
          </CardHeader>

          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!showTwoFactor ? (
                <>
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

                  <PasswordInput
                    label="密码"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    error={errors.password}
                    placeholder="请输入您的密码"
                    autoComplete="current-password"
                    required
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) => handleChange('rememberMe', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-300">记住我</span>
                    </label>

                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-primary-400 hover:text-primary-300"
                    >
                      忘记密码？
                    </Link>
                  </div>
                </>
              ) : (
                <Input
                  label="双因素认证代码"
                  type="text"
                  value={formData.twoFactorCode || ''}
                  onChange={(e) => handleChange('twoFactorCode', e.target.value)}
                  error={errors.twoFactorCode}
                  placeholder="请输入 6 位验证代码"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {showTwoFactor ? '验证并登录' : '登录'}
              </Button>
            </form>

            {showTwoFactor && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowTwoFactor(false)}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  返回登录
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                还没有账户？{' '}
                <Link
                  to="/auth/register"
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 安全提示 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            登录即表示您同意我们的{' '}
            <Link to="/terms" className="text-primary-400 hover:text-primary-300">
              服务条款
            </Link>
            {' '}和{' '}
            <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
