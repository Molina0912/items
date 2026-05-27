import { EventBus } from '@expo/core';
import { TelemetrySDK } from '@expo/telemetry';
import { I18n } from '@expo/i18n';
import { Renderer } from '@expo/tui';
import { IDEServer, registerDefaultMethods } from '@expo/ide-protocol';
import { UpdateChecker } from '@expo/update';
import { ToolRegistry, ToolExecutor } from '@expo/tools';
import type { PermissionEvaluatorLike } from '@expo/tools';

export interface AppOptions {
  headless?: boolean;
  configDir?: string;
  localesDir?: string;
  permissionEvaluator?: PermissionEvaluatorLike;
  permissionMode?: 'auto' | 'interactive' | 'strict';
}

export async function createApp(options: AppOptions = {}) {
  const eventBus = new EventBus();

  // Initialize telemetry
  const telemetry = new TelemetrySDK({
    enabled: false,
    serviceName: 'expo-cli',
  });
  telemetry.init();

  // Initialize i18n
  const i18n = new I18n({
    locale: 'en',
    fallbackLocale: 'en',
    localesDir: options.localesDir ?? './locales',
  });

  // Initialize renderer
  const renderer = new Renderer({ altScreen: !options.headless });

  // Initialize IDE protocol server
  const ideServer = new IDEServer();
  registerDefaultMethods(ideServer);

  // Initialize update checker
  const updateChecker = new UpdateChecker('expo-cli', '0.1.0');

  // Initialize tool registry and executor with permission evaluator
  const toolRegistry = new ToolRegistry();
  const toolExecutor = new ToolExecutor(toolRegistry, {
    permissionEvaluator: options.permissionEvaluator,
    permissionMode: options.permissionMode ?? 'auto',
  });

  return {
    eventBus,
    telemetry,
    i18n,
    renderer,
    ideServer,
    updateChecker,
    toolRegistry,
    toolExecutor,

    async start() {
      await i18n.init();
      ideServer.start();
      eventBus.emit('app:started', { timestamp: Date.now() });
    },

    async shutdown() {
      ideServer.stop();
      telemetry.shutdown();
      renderer.dispose();
      eventBus.emit('app:shutdown', { timestamp: Date.now() });
    },
  };
}
