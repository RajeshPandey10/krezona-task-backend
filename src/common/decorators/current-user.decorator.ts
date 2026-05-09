import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserShape = {
  id: string;
  role: string;
  [key: string]: unknown;
};

export type RequestWithUser = {
  user?: CurrentUserShape;
};

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!data) {
      return user;
    }

    return user?.[data];
  },
);
