declare global {
  namespace App {
    interface Error {
      message: string;
    }

    // SvelteKit define these extension points; this scaffold does not add application fields yet.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Locals {}

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageData {}

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface PageState {}

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Platform {}
  }
}

export {};
