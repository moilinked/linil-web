"use client"

import { Button } from "@/components/ui/button"
import {
  notifyFailure,
  notifyInfo,
  notifyMessage,
  notifySuccess,
  notifyWarning,
} from "@/features/admin/components/notify"

export function ToastTestButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        notifyMessage("A notification for you.")
        notifyFailure(
          "保存失败",
          "草稿版本已过期。\n\nexpected_version 与服务器不一致。请刷新页面后再保存，避免覆盖其他人的修改。",
        )
        notifyWarning("Proceed with caution.")
        notifyInfo("Some information for you.")
        notifySuccess("创建成功")
      }}
    >
      测试提示
    </Button>
  )
}
