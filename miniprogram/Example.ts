interface Hello {
  name: string
}

export class ClassHello implements Hello {
  name: string;
  constructor() {
    this.name = "class hello"
  }
}
