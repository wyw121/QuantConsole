import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/ui'
import type { ChangePasswordRequest, LoginRequest, RegisterRequest } from '@/types'
import { useCallback, useState } from 'react'

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginStore,
    logout: logoutStore,
    setLoading,
    setError,
    clearError,
  } = useAuthStore()

  const { addNotification } = useNotificationStore()

  // 登录
  const login = useCallback(async (data: LoginRequest) => {
    try {
      setLoading(true)
      clearError()

      const response = await authApi.login(data)
      loginStore(response)

      addNotification({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${response.user.username}！`,
      })

      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      setError(message)
      addNotification({
        type: 'error',
        title: '登录失败',
        message,
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [loginStore, setLoading, setError, clearError, addNotification])

  // 注册
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setLoading(true)
      clearError()

      const response = await authApi.register(data)
      loginStore(response)

      addNotification({
        type: 'success',
        title: '注册成功',
        message: '欢迎加入 QuantConsole！',
      })

      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      setError(message)
      addNotification({
        type: 'error',
        title: '注册失败',
        message,
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [loginStore, setLoading, setError, clearError, addNotification])

  // 登出
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logoutStore()
      addNotification({
        type: 'info',
        title: '已安全登出',
        message: '感谢使用 QuantConsole',
      })
    }
  }, [logoutStore, addNotification])

  // 修改密码
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      setLoading(true)
      clearError()

      await authApi.changePassword(data)

      addNotification({
        type: 'success',
        title: '密码修改成功',
        message: '您的密码已成功更新',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '密码修改失败'
      setError(message)
      addNotification({
        type: 'error',
        title: '密码修改失败',
        message,
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, addNotification])

  // 验证邮箱
  const verifyEmail = useCallback(async (token: string) => {
    try {
      setLoading(true)
      clearError()

      await authApi.verifyEmail(token)

      addNotification({
        type: 'success',
        title: '邮箱验证成功',
        message: '您的邮箱已成功验证',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '邮箱验证失败'
      setError(message)
      addNotification({
        type: 'error',
        title: '邮箱验证失败',
        message,
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, clearError, addNotification])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    changePassword,
    verifyEmail,
    clearError,
  }
}

// 表单验证 Hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, (value: any) => string | undefined>
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))

    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  const validateField = useCallback((field: keyof T, value: any) => {
    const error = validationRules[field]?.(value)
    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }, [validationRules])

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(values).forEach(key => {
      const field = key as keyof T
      const error = validationRules[field]?.(values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(
      Object.keys(values).reduce((acc, key) => ({
        ...acc,
        [key]: true,
      }), {})
    )

    return isValid
  }, [values, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
  }
}

// 本地存储 Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

// 异步操作 Hook
export const useAsync = <T, P extends any[]>(
  asyncFunction: (...args: P) => Promise<T>
) => {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
  }>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: P) => {
      setState({ data: null, loading: true, error: null })

      try {
        const data = await asyncFunction(...args)
        setState({ data, loading: false, error: null })
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'
        setState({ data: null, loading: false, error: errorMessage })
        throw error
      }
    },
    [asyncFunction]
  )

  return {
    ...state,
    execute,
  }
}
